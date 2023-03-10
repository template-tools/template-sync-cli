import test from "ava";
import { execa } from "execa";

const nts = new URL("../src/template-sync-cli.mjs", import.meta.url).pathname;

test.serial("cli dryrun", async t => {
  const c = await execa(nts, ["--dry", "arlac77/config-expander"]);

  //t.truthy(c.stdout.match(/\-|.+:.+/));
  t.truthy(c.stdout.match(/github:arlac77\/config-expander/));
  t.is(c.exitCode, 0);
});

test.serial("cli list properties", async t => {
  const c = await execa(nts, ["--list-properties", "arlac77/config-expander"]);
  t.is(c.exitCode, 0);

  const out = JSON.parse(c.stdout);
  t.is(out.description, "Expands expressions in config files");
});
