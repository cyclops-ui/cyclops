---
slug: cyctl
sidebar_label: Using cyctl
title: Install Cyclops with our CLI
description: "cyctl is the Cyclops CLI tool"
---

## Install cyctl

Cyclops has its own CLI tool called cyctl.
To install Cyclops in your cluster with cyctl, firstly install cyctl with homebrew:

```shell
brew install cyctl
```

> _Check if the installation was succesfull by running `cyctl -v`_

## Install Cyclops

To install Cyclops into your cluster, run:

```shell
cyctl init
```

It will create a new namespace called cyclops and deploy everything you need for your Cyclops instance to run.

To access Cyclops UI, use the following command:

```shell
cyctl serve
```

You can now access Cyclops in your browser on [localhost:3000](http://localhost:3000)
