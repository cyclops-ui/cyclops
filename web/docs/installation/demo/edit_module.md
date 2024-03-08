# Edit Module

Let's edit the values of our module and see what happens! The first step is to click on the _Edit_ button.

## Replicas || Version

Try changing the number of replicas or the version of the image (`1.14.2` -> `1.14.1`) to see how the pods are changing.
![Pods Version Change](../../../static/img/demo/pods_version_change.png?raw=true "Pods Version Change")

We can see in the image above that we have some pods that are running on the version `1.14.2` that are waiting to be
replaced by the pods that are of version `1.14.1`. In the end there will be only the `1.14.1` pods up and running.

## Service toggled off

When toggling off the service of a module, the service won't be automatically deleted. Instead, there will be a warning
sign that indicates that the template no longer supports the service and you can delete it manually if necessary.
![Service Toggled Off](../../../static/img/demo/service_toggled_off.png?raw=true "Service Toggled Off")

Now you can delete the service by clicking the _Delete_ button.

## Potential problems

### Naming

If Cyclops seemingly freezes when trying to save the module, it probably means you didn't follow [the Kubernetes naming
convention](https://kubernetes.io/docs/concepts/overview/working-with-objects/names/).

1. [x] contain no more than 63 characters
2. [x] contain only **lowercase** alphanumeric characters or '-'
3. [x] start with an alphanumeric character
4. [x] end with an alphanumeric character
