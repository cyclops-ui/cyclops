---
slug: cyctl
sidebar_label: Using cyctl
title: Install Cyclops with our CLI
description: "cyctl is the Cyclops CLI tool"
---

## Install cyctl

Cyclops has its own CLI tool called cyctl.
To install Cyclops in your cluster with cyctl, first install cyctl with homebrew:

```shell
brew install cyctl
```

## Install cyctl in linux based machines

Vist ```https://github.com/cyclops-ui/cyclops/releases/``` Page of repository

Select your release version you want, choose the arch suitable for your machine

Let's take example for v0.21.0 version for linux amd64 arch
```shell
wget https://github.com/cyclops-ui/cyclops/releases/download/v0.21.0/cyctl_linux_amd64_v0.21.0.tar.gz
tar -xzvf cyctl_linux_amd64_v0.21.0.tar.gz
sudo mv cyctl /usr/local/bin/
```


> _Check if the installation was successful by running `cyctl -v`_

## Install Cyclops

To install Cyclops into your cluster, run:

```shell
cyctl init
```

> _There are additional options when installing with cyctl, which you can check out [here](../../cyctl/cyctl_init.md)_

It will create a new namespace called `cyclops` and deploy everything you need for your Cyclops instance to run.

To access Cyclops UI, use the following command:

```shell
cyctl serve
```

You can now access Cyclops in your browser on [localhost:3000](http://localhost:3000)
