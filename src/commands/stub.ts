export function runStub(name: string, sprint: string): void {
  process.stdout.write(
    `\`codetama --${name}\` is coming in ${sprint}. See features.md for the roadmap.\n`,
  );
}
