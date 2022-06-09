#!/usr/bin/env -S node --trace-deprecation --trace-warnings

import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { readFile } from "fs/promises";
import { program } from "commander";
import { removeSensibleValues } from "remove-sensible-values";
import AggregationProvider from "aggregation-repository-provider";
import { defaultLogLevels } from "loglevel-mixin";
import { Context } from "@template-tools/template-sync";
import { setProperty, defaultEncodingOptions } from "./util.mjs";

process.on("uncaughtException", console.error);
process.on("unhandledRejection", console.error);

const { version, description } = JSON.parse(
  readFileSync(
    fileURLToPath(new URL("../package.json", import.meta.url)),
    defaultEncodingOptions
  )
);

const properties = {
  messageDestination: {
    trace: console.info,
    info: console.info,
    warn: console.warn,
    error: console.error
  }
};

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
  .option("--dry", "do not create branch/pull request")
  .option("--create", "create repository if not present in provider")
  .option("--track", "track templates in package.json")
  .option(
    "-d, --define <key=value>",
    "set option",
    (value, properties) => setProperty(properties, ...value.split(/=/)),
    properties
  )
  .option("--list-providers", "list providers with options and exit")
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
      const provider = await AggregationProvider.initialize(
        [],
        properties,
        process.env
      );

      if (options.listProviders) {
        console.log(
          [
            ...provider.providers.map(
              p => `${p.name}: ${JSON.stringify(p.toJSON())}`
            )
          ].join("\n")
        );

        return;
      }

      if (branches.length === 0 || branches[0] === ".") {
        const pkg = JSON.parse(
          await readFile("package.json", defaultEncodingOptions)
        );
        if (pkg.repository && pkg.repository.url) {
          branches.push(pkg.repository.url);
        } else {
          console.error("Unable to identify repository");
        }
      }

      for (const branch of branches) {
        const context = new Context(provider, branch, {
          ...options,
          properties,
          logLevel
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
            typeof pr === "string" ? pr : `${pr.identifier} ${pr.title}`
          );
        }
      }
    } catch (err) {
      console.error(err);
      process.exit(-1);
    }
  })
  .parse(process.argv);