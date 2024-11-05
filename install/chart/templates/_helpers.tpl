{{- define "cyclops.namespace" -}}
{{- if ((.Values.global).singleNamespaceScope).enabled -}}
{{ .Values.global.singleNamespaceScope.namespace }}
{{- else if .Release.Namespace -}}
{{ .Release.Namespace }}
{{- else -}}
cyclops
{{- end -}}
{{- end -}}

{{- define "cyclops-ctrl.host" -}}
{{ ((.Values.ui).ctrlHost) | default (printf "http://cyclops-ctrl.%s:8080" (include "cyclops.namespace" .))  | quote }}
{{- end -}}
