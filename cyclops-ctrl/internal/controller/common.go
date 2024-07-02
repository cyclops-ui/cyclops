package controller

// ActionType: list of all supported action type
type ActionType struct {
	create string
	delete string
	update string
	list   string
	edit   string
}

var Action = ActionType{
	create: "create",
	delete: "delete",
	update: "update",
	list:   "list",
	edit:   "edit",
}

type ResourceType struct {
	module           string
	templatestore    string
	templateauthrule string
}

var Resource = ResourceType{
	module:           "module",
	templatestore:    "templatestore",
	templateauthrule: "templateauthrule",
}
