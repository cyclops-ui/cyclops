# Install

⚠️ Before installing Cyclops, make sure you have all the [prerequisites](./prerequisites) ⚠️

To install Cyclops in your cluster, run commands below:

```bash
kubectl apply -f https://raw.githubusercontent.com/cyclops-ui/cyclops/v0.0.1-alpha.8/install/cyclops-install.yaml
```

It will create a new namespace called `cyclops` and deploy everything you need for your Cyclops instance to run.

Now all that is left is to expose Cyclops server outside the cluster. You will still need to expose both backend and
frontend with the commands below. Expose frontend through:

```bash
kubectl port-forward svc/cyclops-ui 3000:3000 -n cyclops
```

and backend through:

```bash
kubectl port-forward svc/cyclops-ctrl 8080:8080 -n cyclops
```

You can now access Cyclops in your browser on [http://localhost:3000](http://localhost:3000).
