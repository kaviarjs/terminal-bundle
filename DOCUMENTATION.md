An utility bundle helping you to create and run commands from your terminal within the context of your kernel.

```bash
npm i -S @kaviar/terminal-bundle
```

```typescript
// file: src/cli.ts
import { TerminalBudle } from "@kaviar/terminal-bundle";

const kernel = new Kernel({
  bundles: [
    new TerminalBundle({
      // You can also add commands from within your bundles
      // via CommanderService.registerCommand()
      commands: [],
    }),
  ],
});

kernel.init();
```

## Command Types

There are several types of commands:

Inquire & Write:

- An inquirer, responsible for asking the right questions from you
- A writer, responsible of taking the model extracted by the inquirer and transforming it into files

Executor:

- Simply executes a function with arguments you can pass from command line

Inquire & Executor:

- An inquirer, responsible for asking the right questions from you
- Simply executes a function with the model from Inquire & Executor

## Creating a command

```typescript
import { Service, Inject, ContainerInstance } from "@kaviar/core";

@Service()
class DropCollectionCommand implements IExecutor<{ collectionName: string }> {
  @Inject()
  protected readonly container: ContainerInstance;

  execute(model) {
    // get the db service via injection in constructor
    // drop model.collectionName
  }
}

// In init() phase of your bundle
import { CommanderService } from "@kaviar/terminal-bundle";

CommanderService.registerCommand({
  namespace: "app",
  name: "drop-collection"
  executor: DropCollectionCommand
});

```

## Command Line

You can run `.ts` files directly using `ts-node` package:

```bash
npm i -g ts-node
```

```bash
ts-node src/cli.ts --help
ts-node src/cli.ts run "app:drop-collection"

# Autocompletion for your commands
ts-node src/cli.ts
```

You can also create the model from `JSON`:

```bash
./cli run app:drop-collection --model "{ collectionName: 'users' }"
```

## Asking Questions

Let's explore how we can use the inquirer to ask questions.

```typescript
import { Shortcuts, Inquirer } from "@kaviar/terminal-bundle";

class DropCollectionModel {
  collectionName: string;
}

class DropCollectionInquirer extends Inquirer<DropCollectionModel> {
  model = new DropCollectionModel();

  async inquire() {
    // This will inject the returned value of the inpuit
    await this.prompt(
      "collectionName",
      Shortcuts.input("Enter the collection name")
    );
    // DO: get the db service via injection in constructor and drop it

    // Big version
    await this.prompt("collectionName", {
      question: {
        // things from inquirer.js
        message: "Enter a collection name",
        type: "input",
      },
    });

    // You can re-use inquirers and store it inside this model
    await this.prompt("address", {
      inquirer: AddressInquirer,
    });

    // You can also infinitely ask for stuff and store in an array
    await this.prompt(
      "addresses",
      {
        inquirer: AddressInquirer, // works with questions also!
        default: SomeDefaultAddress,
      },
      {
        many: true,
        // What to ask after an address has been inputted
        continuationMessage: "Add another address?",
      }
    );

    // This will infinitely
  }
}

// Now re-use the same executor
CommanderService.registerCommand({
  namespace: "app",
  name: "drop-collection",
  inquirer: DropCollectionInquirer,
  executor: DropCollectionCommand,
});
```

## Writing files

Now, we could have used executor to write files, but the problem is that writing files requires additional logic this is why we introduce the "writer":

```typescript
import { BlueprintWriter, IBlueprintWriterSession } from "@kaviar/terminal-bundle";
import _ from 'lodash';

class CollectionBlueprintWriter extends BlueprintWriter<DropCollectionModel> {
  // Not that you can use Inject and have access to the container via this.container

  async write(model: DropCollectionModel, session: IBlueprintWriterSession) {
    session.append(`src/bundles/core/${model.collectionName}`, renderYourTemplateSomehow(model)));

    // Compose with other writers if you do have them and pass them the current session
    this.getWriter(CollectionHooks).write(model.hooks, session);

    // You just push things to session, you do not commit anything
    session.afterCommit(() => {
      // Your files have been written
    })
  }
}
```
