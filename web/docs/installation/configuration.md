# Configuration

Following are environment variables you can use to configure your instance of Cyclops. You can set those environment
variables directly on the `cyclops-ui` Kubernetes deployment.

### Cyclops UI

| Name                               | Description                                                               | Default value         |
|:-----------------------------------|:--------------------------------------------------------------------------|:----------------------|
| REACT_APP_CYCLOPS_CTRL_HOST        | Content                                                                   | http://localhost:8080 |
| REACT_APP_DEFAULT_TEMPLATE_REPO    | Default template repo (E.g. https://github.com/cyclops-ui/templates)      | -                     |
| REACT_APP_DEFAULT_TEMPLATE_PATH    | Default template path (E.g. `demo`)                                       | -                     |
| REACT_APP_DEFAULT_TEMPLATE_VERSION | Default template version<br/>Can be a commit hash, a tag or a branch name | -                     |
