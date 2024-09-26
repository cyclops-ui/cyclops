---
sidebar_label: Using kubectl
---

# Install

To install Cyclops in your cluster, run commands below:

```bash
kubectl apply -f https://raw.githubusercontent.com/cyclops-ui/cyclops/v0.13.1/install/cyclops-install.yaml && kubectl apply -f https://raw.githubusercontent.com/cyclops-ui/cyclops/v0.13.1/install/demo-templates.yaml
```

It will create a new namespace called `cyclops` and deploy everything you need for your Cyclops instance to run.

Now all that is left is to expose Cyclops server outside the cluster:

```bash
kubectl port-forward svc/cyclops-ui 3000:3000 -n cyclops
```

You can now access Cyclops in your browser on [http://localhost:3000](http://localhost:3000).
