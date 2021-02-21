import { IBlueprintWriter, IBlueprintWriterSession } from "../defs";
import { Constructor, ContainerInstance, Inject } from "@kaviar/core";

export abstract class BlueprintWriter implements IBlueprintWriter {
  @Inject()
  protected readonly container: ContainerInstance;

  abstract write(model: any, session: IBlueprintWriterSession);

  /**
   * @param writerClass
   */
  getWriter<T>(writerClass: Constructor<T>): T {
    return this.container.get(writerClass);
  }
}
