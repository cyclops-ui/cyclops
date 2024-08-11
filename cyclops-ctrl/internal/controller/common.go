package controller

// Action[Type]: list of all supported action type
const (
	ActionCreate string = "create"
	ActionDelete string = "delete"
	ActionUpdate string = "update"
	ActionList   string = "list"
	ActionEdit   string = "edit"
)

// Resource[Type]: list of all supported resources type
const (
	ResourceModule           string = "module"
	ResourceTemplateStore    string = "templatestore"
	ResourceTemplateAuthRule string = "templateauthrule"
)
