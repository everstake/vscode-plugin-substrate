<h1 align="center">VSCode Plugin for Substrate</h1>

This plugin provides a convenient development environment for Parity Substrate framework.

## Prerequisites

To start using this extension - install it from [marketplace](). To run this extension you need following pre-requirements:

1) Visual Studio Code v1.37.0+
2) Yarn v1.13.0+

## How to run

Steps:

1) Clone project and open it in VSCode.
2) Execute command `yarn` and `yarn compile` in terminal.
3) Press `F5`.

## To start webview development:

1) Execute the command `yarn watch:views`.
2) Press `F5`.
3) Press `CMD + SHIFT + P` and type `Show webview`.
4) Make changes to webview in `./src/views`.

## Features

All features and it's functionality you can find in [tutorial file](TUTORIAL.md).

## Plugin dependencies

Next plugins will be automatically installed with this plugin:

* [Rust language support](https://github.com/rust-lang/rls-vscode)

## License

This project is licensed under the Apache-2.0 License - see the [LICENSE](LICENSE) file for details.
