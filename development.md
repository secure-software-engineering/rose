# Developing and building ROSE

This documents all necessary steps to set up a development environment on Ubuntu 16.04 LTS and build ROSE from source.

## Setup up the development environment

### 1. Set up build tools: NodeJs and npm

ROSE is build with NodeJS. Therefore we need to install NodeJS and with it the package manager npm. We developed ROSE with NodeJS version 7.x.

```shell
curl -sL https://deb.nodesource.com/setup_7.x | sudo -E bash -
sudo apt-get install -y nodejs
```

curl comes not with Ubuntu 16.04 preinstalled. You can install it with `sudo apt install curl`.

From: https://github.com/nodesource/distributions#deb

### 2. Install global NodeJs modules

Besides `npm` we use `bower` for dependencies, for the build process we use `gulp` and `ember-cli`. They can be installed with the Node Package Manager we installed in the previous step.

```shell
npm install --global bower gulp ember-cli
```

### 3. Get the source code

#### a) Checkout the current state

To develop on up-to-date version of ROSE we recommend to use git. Download the current state of the repository by cloning it to your computer.

```shell
sudo apt install git
git clone https://github.com/secure-software-engineering/rose
```

#### b) Download the source as a zip package
We provide source-code packages with every release ([rose/releases](https://github.com/secure-software-engineering/rose/releases)) . Or just download the current state of the repository as a zip file from our [repository main page](https://github.com/secure-software-engineering/rose).

Either way, you now should have a folder called rose on your local computer.

## Build ROSE

Inside this folder you can start the build processes in your shell. Just follow the steps from our [Readme](https://github.com/secure-software-engineering/rose/blob/master/README.md).
