# Prerequisites

In order to test out Cyclops you are going to need some things. First thing you are going to need is a Kubernetes
cluster. If you have one that you can use to play with, great, if not you can try installing
[minikube](https://minikube.sigs.k8s.io/). Minikube sets up a local Kubernetes cluster that you can use to test stuff
out. Check the [docs](https://minikube.sigs.k8s.io/docs/start/) on how to install it.

Another thing you will need is [kubectl](https://kubernetes.io/docs/tasks/tools/). It is a command line interface for
running commands against your cluster.

Once you have installed minikube and kubectl, run your local cluster with:

```bash
minikube start
```

After some time you will have a running cluster that you can use for testing. To verify everything is in order, you can
try fetching all namespaces from the cluster with:

```bash
kubectl get namespaces
```

Output should be something like this:

```
NAME              STATUS   AGE
default           Active   10m
kube-node-lease   Active   10m
kube-public       Active   10m
kube-system       Active   10m
...
```
