#!/usr/bin/env -S node --trace-deprecation --trace-warnings

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { readFile } from "node:fs/promises";
import { program } from "commander";
import { removeSensibleValues } from "remove-sensible-values";
import { defaultLogLevels } from "loglevel-mixin";
import { Context } from "@template-tools/template-sync";
import { setProperty, defaultEncodingOptions } from "./util.mjs";
import { initializeRepositoryProvider } from "./setup-provider.mjs";
import chalk from "chalk";

const { version, description } = JSON.parse(
  readFileSync(
    fileURLToPath(new URL("../package.json", import.meta.url)),
    defaultEncodingOptions
  )
);

const properties = {};
let templates = [];

Object.keys(defaultLogLevels).forEach(level =>
  program.option(`--${level}`, `log level ${level}`)
);

program
  .usage(description)
  .version(version)
  .arguments(
    "[branches...]",
    "branches where the templates schould be applied to"
  )
  .option("--no-cache", "cache requests")
  .option("--statistics", "show cache statistics")
  .option("--dry", "do not create branch/pull request")
  .option("--create", "create repository if not present in provider")
  .option("--track", "track templates in package.json")
  .option(
    "-d, --define <key=value>",
    "set option",
    (value, properties) => setProperty(properties, ...value.split(/=/)),
    properties
  )
  .option(
    "--list-properties",
    "list all properties (if given of the first branch) and exit"
  )
  .option(
    "-t, --template <identifier>",
    "template repository to be assigned (or removed if preceeded with '-')",
    value => (templates = templates.concat(value))
  )
  .option(
    "-u, --dump-template <directory>",
    "extract aggregated template entries"
  )
  .action(async branches => {
    const options = program.opts();

    let logLevel = "info";
    Object.keys(defaultLogLevels).forEach(level => {
      if (options[level]) {
        logLevel = level;
      }
    });

    try {
      const { provider, cache } = await initializeRepositoryProvider(
        program,
        properties
      );

      if (branches.length === 0 || branches[0] === ".") {
        const pkg = JSON.parse(
          await readFile("package.json", defaultEncodingOptions)
        );
        if (pkg?.repository?.url) {
          branches.push(pkg.repository.url);
        } else {
          console.error(
            chalk.red("Unable to identify repository from package.json")
          );
        }
      }

      for (const branch of branches) {
        const context = new Context(provider, branch, {
          ...options,
          properties,
          logLevel,
          log: (level, ...args) => {
            let message = "";
            if (typeof args[0] === "object") {
              if (args[0].branch) {
                message = args[0].branch.fullName + ":";
                delete args[0].branch;
              }
            }

            message += JSON.stringify(args);

            switch (level) {
              case "info":
                console.log(chalk.gray(message));
                break;
              case "error":
                console.error(chalk.red(message));
                break;
              default:
                console.log(message);
            }
          }
        });

        await context.initialize();

        if (options.dumpTemplate) {
          await context.template.dump(options.dumpTemplate);
          return;
        }

        if (options.listProperties) {
          console.log(
            JSON.stringify(
              removeSensibleValues(context.properties),
              undefined,
              2
            )
          );
          return;
        }

        for await (const pr of context.execute()) {
          console.log(
            typeof pr === "string"
              ? pr
              : (pr.empty ? chalk.gray : chalk.green)(
                  `${pr.identifier} ${pr.title}`
                )
          );
        }

        if (options.statistics && cache) {
          console.error(cache.statistics);
        }
      }
    } catch (err) {
      console.error(chalk.red(err));
      process.exit(-1);
    }
  })
  .parse(process.argv);
