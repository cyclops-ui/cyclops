# Cyclops

![](https://raw.githubusercontent.com/cyclops-ui/cyclops/main/web/static/img/cyclops-simplistic.png)

Cyclops is an open-source tool that allows you to create custom Kubernetes UIs. With Cyclops, you can specify the right level of abstraction you need while deploying applications. You can specify all the Kubernetes objects that your system needs, as well as all of the fields your developers need to get their apps deployed - validations included!

You can check [Cyclops landing page](https://cyclops-ui.com) or our [GitHub repo](https://github.com/cyclops-ui/cyclops) for documentation and more details.

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

You can now access Cyclops in your browser on `http://localhost:3000`.

Alternatively, you can expose Cyclops service via ingress.
