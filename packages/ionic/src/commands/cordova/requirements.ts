import chalk from 'chalk';

import { CommandLineInputs, CommandLineOptions, CommandMetadata, CommandPreRun, isExitCodeException } from '@ionic/cli-utils';
import { FatalException } from '@ionic/cli-utils/lib/errors';
import { filterArgumentsForCordova } from '@ionic/cli-utils/lib/integrations/cordova/utils';

import { CordovaCommand } from './base';

export class RequirementsCommand extends CordovaCommand implements CommandPreRun {
  async getMetadata(): Promise<CommandMetadata> {
    return {
      name: 'requirements',
      type: 'project',
      description: 'Checks and print out all the requirements for platforms',
      longDescription: `
Like running ${chalk.green('cordova requirements')} directly, but provides friendly checks.
      `,
      inputs: [
        {
          name: 'platform',
          description: `The platform for which you would like to gather requirements (${['android', 'ios'].map(v => chalk.green(v)).join(', ')})`,
        },
      ],
    };
  }

  async preRun(inputs: CommandLineInputs, options: CommandLineOptions): Promise<void> {
    await this.preRunChecks();
  }

  async run(inputs: CommandLineInputs, options: CommandLineOptions): Promise<void> {
    const { getPlatforms, installPlatform } = await import('@ionic/cli-utils/lib/integrations/cordova/project');

    const [ platform ] = inputs;

    const platforms = await getPlatforms(this.env.project.directory);

    if (platform) {
      if (!platforms.includes(platform)) {
        const confirm = await this.env.prompt({
          message: `Platform ${chalk.green(platform)} is not installed! Would you like to install it?`,
          type: 'confirm',
          name: 'confirm',
        });

        if (confirm) {
          await installPlatform(this.env, platform);
        } else {
          throw new FatalException(
            `Can't gather requirements for ${chalk.green(platform)} unless the platform is installed.\n` +
            `Did you mean just ${chalk.green('ionic cordova requirements')}?\n`
          );
        }
      }
    }

    const metadata = await this.getMetadata();

    try {
      await this.runCordova(filterArgumentsForCordova(metadata, inputs, options), { showExecution: true, showError: false, fatalOnError: false });
    } catch (e) {
      if (e.fatal || !isExitCodeException(e)) {
        throw e;
      }

      throw new FatalException();
    }
  }
}
