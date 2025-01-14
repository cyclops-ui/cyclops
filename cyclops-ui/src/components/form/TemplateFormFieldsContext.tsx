import React, { createContext, ReactNode, useContext } from "react";

interface TemplateFormFieldsContextType {
  themePalette?: "dark" | "light";
}

const TemplateFormFieldsContext = createContext<
  TemplateFormFieldsContextType | undefined
>(undefined);

interface TemplateFormFieldsContextProviderProps {
  themePalette?: "dark" | "light";
  children: ReactNode;
}

export const TemplateFormFieldsContextProvider: React.FC<
  TemplateFormFieldsContextProviderProps
> = ({ themePalette, children }) => {
  return (
    <TemplateFormFieldsContext.Provider
      value={{
        themePalette,
      }}
    >
      {children}
    </TemplateFormFieldsContext.Provider>
  );
};

export const useTemplateFormFields = (): TemplateFormFieldsContextType => {
  const context = useContext(TemplateFormFieldsContext);
  if (!context) {
    throw new Error(
      "useTemplateFormFields must be used within a TemplateFormFieldsContextProvider",
    );
  }
  return context;
};
