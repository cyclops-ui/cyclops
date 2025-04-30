{{- define "cyclops.namespace" -}}
{{- if .Release.Namespace -}}
{{ .Release.Namespace }}
{{- else -}}
cyclops
{{- end -}}
{{- end -}}

{{- define "watchNamespace" -}}
- name: CYCLOPS_MODULE_NAMESPACE
{{- if (.Values.scope).watchNamespace }}
  value: {{ .Values.scope.watchNamespace | quote }}
{{- else  }}
  value: {{ include "cyclops.namespace" . | quote }}
{{- end -}}
{{- end -}}
