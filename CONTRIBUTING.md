# Contributing to Cyclops

Welcome, glad to see you here.

If you are up to the challenge of contributing to Cyclops, this document will help guide you on your journey. And if you want to talk to us directly, join our [Discord](https://discord.com/invite/8ErnK3qDb3) where we have a `looking-to-contribute` channel.

Please note we have a [code of conduct](./CODE_OF_CONDUCT.md), follow it in all your interactions with the project.

## The components that make Cyclops

Cyclops is a mono-repo which contains both the frontend (`UI`) and the backend(`controller`) of the platform, as well as the code for our website and documentation (`web`).

- **controller**

  - `/cyclops-ctrl`
  - REST API serving data about Cyclops modules (modules CRUD)
  - listens for module changes and creates all needed resources from the template
  - Go, [kubebuilder](https://book.kubebuilder.io/)

- **UI**

  - `/cyclops-ui`
  - shows info about modules
  - renders form based on the module template
  - Typescript, React, [Ant Design](https://ant.design/),

- **docs**
  - `/web`
  - website with the Cyclops documentation
  - [docusaurus](https://docusaurus.io/)

## Running services

Before you start contributing, it is a good idea to get a feel of the project and try it out locally. The next chapter will go through how to run each mentioned component.

But before you can start running the components, you need to set up your dev environment. If you already have a Kubernetes cluster you can use, you can skip this step. If not, don't worry, this won't take long.

### **Minikube**

To run the controller, you will need a Kubernetes cluster to connect it to. For the sake of development, you can use [minikube](https://minikube.sigs.k8s.io/docs/).
You can install minikube and run it using `minikube start`. It will set up a Kubernetes cluster locally and configure your kubeconfig file to point to the minikube cluster.

> ❗ **_ATTENTION_** ❗
>
> Cyclops has it's own [custom resource](https://kubernetes.io/docs/concepts/extend-kubernetes/api-extension/custom-resources/) which you need to install into your cluster before trying to run Cyclops.
> You can install it with using the command bellow:
>
> ```
> kubectl apply -f https://raw.githubusercontent.com/cyclops-ui/cyclops/main/install/CRDs/cyclops-module.yaml
> ```

### **Controller** `/cyclops-ctrl`

You can run the controller inside the cluster deployed as a Kubernetes deployment, described [here](https://github.com/cyclops-ui/cyclops/blob/a4d21a48648e79fe27e51600f5489ae0d36175a7/install/cyclops-install.yaml#L259),
or you can run it outside of the cluster.

After you have your cluster up and running and you have installed the CRD into it, position yourself in `cyclops-ctrl` and run the command below from the terminal to start the controller.

```
make start
```

> 📌 **_NOTE_** 📌
>
> The default port of the REST API is 8080. If you would like to change the port of the REST API, you can do it by setting the env var:
>
> ```
> export PORT=xxxx
> ```

### **UI** `/cyclops-ui`

UI depends on the controller API. Again you can run inside the cluster as well as outside. To run it, position yourself
in `cyclops-ui`. After that you will need to install all the dependencies using

```
npm i -f
```

Once dependencies are installed, you can run the UI

```
npm start
```

> 📌 **_NOTE_** 📌
>
> If you changed the port of the REST API, you will need to update it in the UI as well.

### **Documentation** `/web`

You can run our page locally by installing the dependencies

```
npm i -f
```

and running the app

```
npm start
```

## Where to start

- If you are new to the project, please check out the [good first issue](https://github.com/cyclops-ui/cyclops/issues?q=is:open+is:issue+label:%22good+first+issue%22) label.
- If you are looking for something to work on, check out our open issues.
- If you have an idea for a new feature, please open an issue, and we can discuss it.
- If you think the documentation on our website was unclear or you found a broken link, please feel free to fix it
- We are also happy to help you find something to work on. Just reach out to us on [Discord](https://discord.com/invite/8ErnK3qDb3).

## How to contribute

- [Fork the repository](https://github.com/cyclops-ui/cyclops/fork) and clone it locally
- Create a new branch
- Make your changes
- Create a pull request back to the upstream repository (_Please make sure that your PR is up-to-date with the latest changes in main_)
- Wait for a review and address any comments
