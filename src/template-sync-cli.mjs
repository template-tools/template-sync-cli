#!/usr/bin/env -S node --no-warnings --title template-sync
import chalk from "chalk";
import { program } from "commander";
import { readPackageUp } from "read-package-up";
import pkg from "../package.json" with { type: "json" };
import { removeSensibleValues } from "remove-sensible-values";
import { defaultLogLevels } from "loglevel-mixin";
import { Context } from "@template-tools/template-sync";
import { setProperty } from "./util.mjs";
import {
  initializeRepositoryProvider,
  initializeCommandLine,
  repositoryUrl
} from "repository-provider-cli-support";

const properties = {};
let templates = [];

initializeCommandLine(program);

Object.keys(defaultLogLevels).forEach(level =>
  program.option(`--${level}`, `log level ${level}`)
);

program
  .usage(pkg.description)
  .version(pkg.version)
  .argument(
    "[branches...]",
    "branches where the templates schould be applied to"
  )
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
    "-p, --pull-request-branch <identifier>",
    "name of the PR branch to use"
  )
  .option(
    "-t, --template <identifier>",
    "template repository to be assigned (or removed if preceeded with '-')",
    value => (templates = templates.concat(value))
  )
  .option(
    "--list-properties",
    "list all properties (if given of the first branch) and exit"
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

      if (branches.length === 0 || branches[0][0] === ".") {
        const cwd = branches[0] || process.cwd();
        const pkgData = await readPackageUp({ cwd });
        const url = pkgData?.packageJson?.repository?.url;
        if (url) {
          branches[0] = url;
        } else {
          try {
            branches.push(await repositoryUrl(cwd));
          } catch (e) {
            if(e.code !== "ENOENT") {
              console.log(e);
            }
          }
          if (branches.length === 0) {
            console.error(
              chalk.red(
                `Unable to identify repository from ${
                  pkgData?.path || "package.json"
                }`
              )
            );
          }
        }
      }

      for await (const branch of provider.branches(branches)) {
        const context = new Context(provider, branch, {
          ...options,
          properties,
          logLevel,
          log: (level, ...args) => {
            let message = "";
            if (typeof args[0] === "object") {
              if (args[0].branch) {
                message = args[0].branch;
                delete args[0].branch;
              }

              if (args[0].message) {
                if (message.length) {
                  message += " " + args[0].message;
                } else {
                  message = args[0].message;
                }
                delete args[0].message;
              }

              for (const [k, v] of Object.entries(args[0])) {
                message += ` ${k}=${v}`;
              }
              args.shift();
            }

            if (args.length > 1) {
              message += args.join(" ");
            } else if (args.length === 1) {
              message += args[0];
            }

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
      console.error(err);
      console.error(chalk.red(err));
      process.exit(-1);
    }
  })
  .parse(process.argv);
