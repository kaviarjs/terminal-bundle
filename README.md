# Terminal Bundle

An utility bundle helping you to create and run commands within the context of your container.

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

## Create a shortcut for yourself:

```
ln -s dist/cli.js cli ; chmod 755 cli
```

## Run it:

```
./cli --help
./cli run "my:command"
./cli run "my:command" --model "{collectionName: 'Users'}"
./cli list

# Autocompletion for your commands
./cli
```

## Command Types

Inquire & Write:

- An inquirer, responsible for asking the right questions from you
- A writer, responsible of taking the model extracted by the inquirer and transforming it into files

Executor:

- Simply executes a function within your containers.

## Creating a command

```typescript
class DropCollectionCommand implements IExecutor<{ collectionName: string }> {
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

```bash
./cli run app:drop-collection --model "{ collectionName: 'users' }"
```

## Asking questions

```typescript
import { Shortcuts, Inquirer } from "@kaviar/terminal-bundle";

class DropCollectionInquirer extends Inquirer<{ collectionName: string }> {
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
import { BlueprintWriter } from "@kaviar/terminal-bundle";
import _ from 'lodash';

// Just a simple template
const CollectionTemplate: IBlueprintTemplate<{ collectionName: string }> = ({ collectionName }) => {
  const className = _capitalize(_.camelCase(collectionName));

  return
`
import X from "...";

export default ${className}Collection {
  // Bla bla bla
}
`;
}

class CollectionBlueprintWriter extends BlueprintWriter<{
  collectionName: string;
}> {
  async write(model, session) {
    // sess
    // get the db service via injection in constructor
    // drop model.collectionName
    session.append(`src/bundles/core/${model.collectionName}`, CollectionTemplate(model)));

    // Compose with other writers:
    this.getWriter(CollectionHooks).write(model.hooks, session);

    // You just push things to session, you do not commit anything
  }
}
```

## Notes

- Both writers and executors are services and they can be injected with any services you have available
- You can compose both Inquirers and BlueprintWriters
- You can have all 3 Inquirers, Writers, Executors. But having both Writer and Executor may not make much sense
- Look at Shortcuts and use it
