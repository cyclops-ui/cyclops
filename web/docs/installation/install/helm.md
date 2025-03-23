---
slug: helm
sidebar_label: Using Helm chart
title: Install Cyclops via Helm chart
description: "Cyclops Helm chart"
---

You can install the Cyclops Helm chart in your Kubernetes cluster using our OCI chart:
```bash
helm install cyclops \
--namespace cyclops \
--create-namespace \
oci://registry-1.docker.io/cyclopsui/cyclops
```

Or add our Helm chart:

```
helm repo add cyclops-ui https://cyclops-ui.com/helm
helm repo update
```

And install Cyclops:

```
helm install cyclops \
--namespace cyclops \
--create-namespace \
cyclops-ui/cyclops
```
---

You can confirm Cyclops is healthy by checking if Cyclops pods are up and running. You can do it with the command below

```
kubectl get pods -n cyclops
```

and if Cyclops is healthy, you will get an output similar to the one below:

```
NAME                           READY   STATUS    RESTARTS   AGE
cyclops-ctrl-8b9cff4db-p74x6   1/1     Running   0          38s
cyclops-ui-6cb54c69bf-g78d5    1/1     Running   0          38s
```

---

Cyclops UI is exposed via a Kubernetes service. You can port forward the service and use it from localhost with the command below:

```
kubectl port-forward svc/cyclops-ui -n cyclops 3000:3000
```

You can now access Cyclops in your browser on [http://localhost:3000](http://localhost:3000).

Alternatively, you can expose Cyclops service via ingress.
