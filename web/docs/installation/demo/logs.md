# Logs
In this short tutorial we will demonstrate our logging feature and how it works. For the purposes of this tutorial you 
are free to use our [Docker image](https://hub.docker.com/r/petarcvit223/logs) that creates a log every few 
seconds, or use your own image that creates logs.

## New Module
We will create a new module, like we did in the [previous tutorial](new_module) but this time we will use a different
template. When prompted to insert the GitHub repository and path, use these values:

```yaml
repository: https://github.com/cyclops-ui/templates
path: multi
```

Fill in the values, but the image should be `petarcvit223/logs` if you are using our image. Set the version to `latest`.
Services can be toggled off, they are not needed for this tutorial.

![Module 'multi' Filled](../../../static/img/demo/filled_logs_form.png?raw=true "Module 'multi' Filled")


## Pods and Containers
If you have successfully created the module, you should see the pods with multiple images.

![Multiple Container Pods](../../../static/img/demo/multiple_container_pods.png?raw=true "Multiple Container Pods")

These pods actually house multiple containers inside them, hence the multiple images in the column, one for each of the
containers.

## View Logs
Now click on the _View Logs_ button. A new popup window has appeared. It contains the last 100 logs of our container. 
Since we have 2 containers in the pod, there are 2 tabs in the popup window - one for each of the containers.

![Logs](../../../static/img/demo/logs.png?raw=true "Logs")


If the pod doesn't have any logs, it will be indicated that there are no logs available for the pod.

Also, you can download the logs into a file to inspect all container logs.

## Potential problems
### Error loading template
This usually means that you didn't input the right `url + path`. When loading the template to Cyclops, you need to copy
the URL from the GitHub repository that leads to the template. The URL must lead towards a directory that holds a
`template` folder.

In our example we filled the form with the values bellow:
```yaml
repository: https://github.com/cyclops-ui/templates
path: multi
```

### Naming
If Cyclops seemingly freezes when trying to save the module, it probably means you didn't follow [the Kubernetes naming
convention](https://kubernetes.io/docs/concepts/overview/working-with-objects/names/).

1. [x] contain no more than 253 characters
2. [x] contain only **lowercase** alphanumeric characters, '-' or '. '
3. [x] start with an alphanumeric character
4. [x] end with an alphanumeric character
