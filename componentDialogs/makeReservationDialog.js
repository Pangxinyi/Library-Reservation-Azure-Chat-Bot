const { WaterfallDialog, ComponentDialog } = require("botbuilder-dialogs");

const {
  ConfirmPrompt,
  ChoicePrompt,
  DateTimePrompt,
  NumberPrompt,
  TextPrompt,
} = require("botbuilder-dialogs");

const { DialogSet, DialogTurnStatus } = require("botbuilder-dialogs");

const CHOICE_PROMPT = "CHOICE_PROMPT";
const CONFIRM_PROMPT = "CONFIRM_PROMPT";
const TEXT_PROMPT = "TEXT_PROMPT";
const NUMBER_PROMPT = "NUMBER_PROMPT";
const DATETIME_PROMPT = "DATETIME_PROMPT";
const WATERFALL_DIALOG = "WATERFALL_DIALOG";
var endDialog = "";

class MakeReservationDialog extends ComponentDialog {
  constructor(conservsationState, userState) {
    super("makeReservationDialog");

    this.addDialog(new TextPrompt(TEXT_PROMPT));
    this.addDialog(new ChoicePrompt(CHOICE_PROMPT));
    this.addDialog(new ConfirmPrompt(CONFIRM_PROMPT));
    this.addDialog(
      new NumberPrompt(NUMBER_PROMPT, this.noOfParticipantsValidator)
    );
    this.addDialog(new DateTimePrompt(DATETIME_PROMPT));

    this.addDialog(
      new WaterfallDialog(WATERFALL_DIALOG, [
        this.firstStep.bind(this), // Ask confirmation if user wants to make reservation?
        this.getName.bind(this), // Get name from user
        this.getNumberOfParticipants.bind(this), // Number of participants for reservation
        this.getDate.bind(this), // Date of reservation
        this.getTime.bind(this), // Time of reservation
        this.confirmStep.bind(this), // Show summary of values entered by user and ask confirmation to make reservation
        this.summaryStep.bind(this),
      ])
    );

    this.initialDialogId = WATERFALL_DIALOG;
  }

  async run(turnContext, accessor) {
    const dialogSet = new DialogSet(accessor);
    dialogSet.add(this);

    const dialogContext = await dialogSet.createContext(turnContext);
    const results = await dialogContext.continueDialog();
    if (results.status === DialogTurnStatus.empty) {
      await dialogContext.beginDialog(this.id);
    }
  }

  async firstStep(step) {
    endDialog = false;
    // Running a prompt here means the next WaterfallStep will be run when the users response is received.
    return await step.prompt(
      CONFIRM_PROMPT,
      "Would you like to make a reservation?",
      ["Yes", "No"]
    );
  }

  async getName(step) {
    console.log(step.result);
    if (step.result === true) {
      return await step.prompt(
        TEXT_PROMPT,
        "In what name reservation is to be made?"
      );
    }

    if (step.result === false) {
      await step.context.sendActivity(
        "You chose not to go ahead with reservation."
      );
      endDialog = true;
      return await step.endDialog();
    }
  }

  async getNumberOfParticipants(step) {
    step.values.name = step.result;
    return await step.prompt(
      NUMBER_PROMPT,
      "How many participants? (Maximum 5 people in a group study room)"
    );
  }

  async getDate(step) {
    step.values.noOfParticipants = step.result;

    return await step.prompt(
      DATETIME_PROMPT,
      "On which date you want to make the reservation?"
    );
  }

  async getTime(step) {
    step.values.date = step.result;

    return await step.prompt(DATETIME_PROMPT, "At what time?");
  }

  async confirmStep(step) {
    step.values.time = step.result;

    return await step.prompt(
      CONFIRM_PROMPT,
      "Are you sure that all the information is correct and want to make the reservation?",
      ["Yes", "No"]
    );
  }

  async summaryStep(step) {
    if (step.result === true) {
      // Business

      await step.context.sendActivity(
        "Reservation successfully made. Your reservation id is : 12345678"
      );
      endDialog = true;
      return await step.endDialog();
    }
  }

  async noOfParticipantsValidator(promptContext) {
    console.log(promptContext.recognized.value);
    // This condition is our validation rule. You can also change the value at this point.
    return (
      promptContext.recognized.succeeded &&
      promptContext.recognized.value > 1 &&
      promptContext.recognized.value < 5
    );
  }

  async isDialogComplete() {
    return endDialog;
  }
}

module.exports.MakeReservationDialog = MakeReservationDialog;
