/// <reference path="../references.ts" />

module Exceptionless {
  export class EventPluginManager {
    public static run(context:EventPluginContext): Promise<any> {
      return context.client.config.plugins.reduce((promise:Promise<any>, plugin:IEventPlugin) => {
        return promise.then(() => {
          return plugin.run(context);
        });
      }, Promise.resolve());
    }

    public static addDefaultPlugins(config:Configuration): void {
      config.addPlugin(new ConfigurationDefaultsPlugin());
      config.addPlugin(new ErrorPlugin());
      config.addPlugin(new DuplicateCheckerPlugin());
      config.addPlugin(new ModuleInfoPlugin());
      config.addPlugin(new RequestInfoPlugin());
      config.addPlugin(new SubmissionMethodPlugin());
    }
  }
}
