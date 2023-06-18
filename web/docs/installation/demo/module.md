# The Module Screen
After you have created your first module, now it is the time to take a look at the Cyclops dashboard. The first thing we
can see in our top left corner is the name of our module (`demo`), the namespace (`cyclops`) where the module inhabits in the
cluster and the link that points towards the GitHub repository where the template is located.

## Actions
Here we have listed the actions that are available to us for the current module.

### Edit
The _Edit_ button takes you to a new screen where you can edit the data we provided when creating the module. Let's
leave it at that for now, we will go more in depth in the next [chapter](edit_module).

### Delete
The _Delete_ button lets you delete the current module. When clicked a popup window will appear that requires you to
write the module name in it. If correctly written the _delete_ button will turn red and can be clicked.
![Delete Module](../../../static/img/demo/delete_module.png?raw=true "Delete Module")

This action deletes the module and all its associated resources from the cluster!

## Resources
The modules resources are displayed here. These resources include _Deployments_ and/or _Services_. The _Services_ tab is
only visible when it is toggled in the configuration.

![Service Toggle On](../../../static/img/demo/service_toggle.png?raw=true "Service Toggle On")

### Deployment
Here are your deployments. Depending on the number of replicas u wanted, there should be an equal amount of pods.
![Deployments](../../../static/img/demo/deployments.png?raw=true "Deployments")

[//]: # (TO-DO: remove "...in the current version of Cyclops...")
The top most element we can see is the name of the deployment, which in our case is `demo1`. Right under we can see
the namespace in which our deployment is located. In the current version of Cyclops, all of your deployments and
services are put in the `default` namespace. Right under the namespace stands a button _View Manifest_. This button
creates a popup that allows you to see the configuration file that Cyclops created after you filled in the values for
the template.

The Pods are displayed one under another. You can see their name, node, phase, lifetime, image and logs. _View Logs_ is 
another popup window that displays the last 100 logs of the pod. If you are still interested in the logs feature, learn more about it in the
[Logs tutorial](logs). For now let's provide a short explanation for of the columns in the Deployment section:
1. `Name` shows the full name of the pod
2. `Node` shows the node in which the pod is running
3. `Phase` shows the phase in which the pod currently is. This can be _Running_, if it's up, or _Pending_, if it's trying to start up
4. `Started` shows how long is the pod already running for
5. `Images` shows which Docker images is the pod using
6. `Logs` shows the last 100 logs for each of the pods containers

### Service
Here is your service. In Kubernetes, a Service is a method for exposing a network application that is running as one or 
more Pods in your cluster. Here we can also see the name of our service `demo1`, the namespace it inhabits `default` and
the manifest. Underneath it shows the port of the service and where it is pointing (port of the pods).

## Potential problems
### Contact info@cyclops-ui.com
If you have any problems with following the tutorial or the application itself, please contact us and we will reply as
soon as possible!