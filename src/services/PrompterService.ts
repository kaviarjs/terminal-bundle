import { IPrompter, IPrompt, IInquirer } from "../defs";
import * as inquirer from "inquirer";
import { QuestionCollection, Inquirer, DistinctQuestion } from "inquirer";
import { ContainerInstance } from "@kaviar/core";

const DUMMY_FIELD = "__dummy";

export class PrompterService implements IPrompter {
  public readonly inquirer: Inquirer;

  constructor(protected readonly container: ContainerInstance) {
    this.inquirer = inquirer;
  }

  /**
   * You can ask a question or delegate the question to another inquiry model
   * @param prompt
   */
  async prompt<V = any>(prompt: IPrompt): Promise<V> {
    if (prompt.question) {
      const question: DistinctQuestion = {
        name: DUMMY_FIELD,
        default: prompt.default,
        ...prompt.question,
      };
      const data = await this.inquirer.prompt([question]);

      return data[question.name];
    } else if (prompt.inquirer) {
      // Please not that inquirer is new everytime due to its "transient" nature
      const inquirer = this.container.get<Inquirer>(prompt.inquirer);

      // Maybe deep clone?
      inquirer.model = prompt.default;
      await inquirer.inquire();

      return inquirer.model;
    }
  }

  /**
   * Continously ask for the same input.
   */
  async promptMany<V = any>(
    prompt: IPrompt,
    continuationMessage?: string
  ): Promise<V[]> {
    const values = [];
    while (true) {
      const value = await this.prompt(prompt);
      values.push(value);

      // Ask if want to continue
      if (!(await this.wishesToContinue(continuationMessage))) {
        break;
      }
    }

    return values;
  }

  protected async wishesToContinue(
    continuationMessage = "Would you like to do this again?"
  ) {
    const again = await this.prompt({
      question: {
        message: continuationMessage,
        default: true,
        type: "confirm",
      },
    });

    return again === true;
  }
}
