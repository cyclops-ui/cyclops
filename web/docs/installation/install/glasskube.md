---
slug: glasskube
sidebar_label: Using Glasskube
title: Install Cyclops with the Glasskube Package Manager
description: "Glasskube is the easiest way to install and open Cyclops."
---

# Glasskube

> [Glasskube](https://github.com/glasskube/glasskube/) is the missing Package Manager for Kubernetes featuring a GUI and a CLI.
> Glasskube packages are dependency aware, GitOps ready and can get automatic updates via a central public package repository.

## Install Glasskube

If you haven't already installed the `glasskube` client you can install it either via brew or follow the [Glasskube Documentation](https://glasskube.dev/docs/getting-started/install/).

```shell
brew install glasskube/tap/glasskube
```

After installing Glasskube you can bootstrap Glasskube with `glasskube bootstrap` or perform an automatic bootstrap with your first package installation.
(This feature is only available in Glasskube v0.0.3+)

## Install Cyclops

Glasskube provides a graphical and command line interface for installing Cyclops.

### Cyclops installation with the Glasskube CLI

You simply install cyclops with:

```shell
glasskube install cyclops
```

and open Cyclops with

```shell
glasskube open cylcops
```

You can now access Cyclops in your browser on [http://localhost:3000](http://localhost:3000).

### Cyclops installation with the Glasskube GUI

#### 1. Open the Glasskube GUI with:

The first step is to open the Glasskube GUI with the `serve` command.

```shell
glasskube serve
```

#### 2. Install Cyclops via the webbrowser

Your default webbrowser will open on [http://localhost:8580](http://localhost:8580).

![Install Cyclops with Glasskube](../../../static/img/install/install-cyclops-with-glasskube.png?raw=true "Install Cyclops with Glasskube")

Where you just need to click the "Install" Button for Cyclops.

#### 3. Open Cyclops

After the Installation of Cyclops you can open Cyclops with the "Open" button.

![Open Cyclops with Glasskube](../../../static/img/install/open-cyclops-with-glasskube.png?raw=true "Open Cyclops with Glasskube")

Glasskube will automatically create all needed port forwarding connections and open Cyclops on [http://localhost:3000](http://localhost:3000).

