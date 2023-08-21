# Contributing

When contributing to this repository, please first discuss the change you wish to make via issue, email, or any other method with the repository owners before making a change.

Please note we have a code of conduct. Please follow it in all your interactions with the project.

## Components

You can contribute to Cyclops by contributing to a couple of different components. Those being:

- controller
  - `/cyclops-ctrl`
  - REST API serving data about Cyclops modules (modules CRUD)
  - listens for module changes and creates all needed resources from the template
  - Go, [kubebuilder](https://book.kubebuilder.io/)
- UI
  - `/cyclops-ui`
  - shows info about modules
  - renders form based on the module template
  - Typescript, React, [antd](https://ant.design/)
- docs
  - `/web`
  - website with Cyclops documentation
  - [docusaurus](https://docusaurus.io/)

## Running services

The next chapter will go through how to run each mentioned component.

### controller `/cyclops-ctrl`

To run the controller, you will need a Kubernetes cluster to connect it to. For the sake of development, you can
use [minikube](https://minikube.sigs.k8s.io/docs/).

> **_NOTE:_**  Using minikube
>
> You can install minikube and run it using `minikube start`. It will set up a Kubernetes cluster locally and configure your kubeconfig file to point to the minikube cluster.

You must install an additional CRD into the cluster to start the controller. You can do it using the
command below.

```
kubectl apply -f https://raw.githubusercontent.com/cyclops-ui/cyclops/main/install/CRDs/cyclops-module.yaml
```

You can run the controller inside the cluster deployed as a Kubernetes deployment, described [here](https://github.com/cyclops-ui/cyclops/blob/a4d21a48648e79fe27e51600f5489ae0d36175a7/install/cyclops-install.yaml#L259),
or you can run it outside of the cluster.

Now that you have your cluster up and running and you have installed the CRD into it position yourself in
`cyclops-ctrl` and run the command below from the terminal to start the controller.
```
make start
```

NOTE: The default port of the REST API is 8080. If you would like to change the port of the REST API, you can do it by
setting the env var:
```
export PORT=8888
```

### UI `/cyclops-ui`

UI depends on the controller API. Again you can run inside the cluster as well as outside. To run it, position yourself
in `cyclops-ui`. After that you will need to install all the dependencies using
```
npm i -f
```
Once dependencies are installed, you can run the UI
```
npm start
```

NOTE: To set the host of the Cyclops controller in the UI, you can change that here.

### docs `/web`

You can run our page locally by installing the dependencies
```
npm i -f
```
and running the app
```
npm start
```

You can add `.md` files to the `/web/docs` folder to enhance our documentation.

## Opening a pull request

To contribute, you can [fork this repo](https://github.com/cyclops-ui/cyclops/fork) and create a PR to the main branch

If you have any additional questions, you can reach out to us via om info@cyclops-ui.com or join our
[Discord](https://discord.com/invite/M6tCEn5f5U)