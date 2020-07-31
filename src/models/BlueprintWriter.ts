import { IBlueprintWriter, IBlueprintWriterSession } from "../defs";
import { Constructor, ContainerInstance, Inject } from "@kaviar/core";

export abstract class BlueprintWriter<T = any> implements IBlueprintWriter<T> {
  @Inject()
  protected readonly container: ContainerInstance;

  abstract write(model: T, session: IBlueprintWriterSession);

  /**
   * @param writerClass
   */
  getWriter<T = any>(
    writerClass: Constructor<BlueprintWriter>
  ): BlueprintWriter<T> {
    return this.container.get(writerClass);
  }
}
