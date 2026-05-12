import chalk from 'chalk';

let useColor = false;

export function initColors(noColor?: boolean): void {
  if (noColor === true || process.env.NO_COLOR) {
    useColor = false;
  } else {
    useColor = true;
  }
  chalk.level = useColor ? 3 : 0;
}

export const color = {
  bold: (text: string) => (useColor ? chalk.bold(text) : text),
  dim: (text: string) => (useColor ? chalk.dim(text) : text),
  cyan: (text: string) => (useColor ? chalk.cyan(text) : text),
  green: (text: string) => (useColor ? chalk.green(text) : text),
  yellow: (text: string) => (useColor ? chalk.yellow(text) : text),
  red: (text: string) => (useColor ? chalk.red(text) : text),
};
