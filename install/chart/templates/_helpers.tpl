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

{{- define "cyclops-ctrl.watchNamespace" -}}
- name: WATCH_NAMESPACE
{{- if ((.Values.global).singleNamespaceScope).enabled }}
  value: {{ .Values.global.singleNamespaceScope.namespace | quote }}
{{- else if (.Values.ctrl).watchNamespace }}
  value: {{ .Values.ctrl.watchNamespace | quote }}
{{- else  }}
  value: {{ include "cyclops.namespace" . | quote }}
{{- end -}}
{{- end -}}

{{- define "cyclops-ctrl.moduleTargetNamespace" -}}
{{- if ((.Values.global).singleNamespaceScope).enabled }}
- name: MODULE_TARGET_NAMESPACE
  value: {{ .Values.global.singleNamespaceScope.namespace | quote }}
{{- else if (.Values.ctrl).moduleTargetNamespace }}
- name: MODULE_TARGET_NAMESPACE
  value: {{ ((.Values.ctrl).moduleTargetNamespace) | quote }}
{{- end -}}
{{- end -}}

{{- define "cyclops-ctrl.watchNamespaceHelm" -}}
{{- if ((.Values.global).singleNamespaceScope).enabled }}
- name: WATCH_NAMESPACE_HELM
  value: {{ .Values.global.singleNamespaceScope.namespace | quote }}
{{- else if (.Values.ctrl).watchNamespaceHelm }}
- name: WATCH_NAMESPACE_HELM
  value: {{ .Values.ctrl.watchNamespaceHelm | quote }}
{{- end -}}
{{- end -}}
