import { useId, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";

/** Names a stack; an emptied field hands the stack back to its front title's name. */
export default function StackRename({
  leaving,
  name,
  fallback,
  onSave,
  onClose,
}: {
  leaving?: boolean;
  name: string;
  /** The front title, shown as the placeholder, since that is what the stack reads as without a name. */
  fallback: string;
  onSave: (name: string) => void;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const id = useId();
  const [value, setValue] = useState(name);
  const save = () => {
    onSave(value);
    onClose();
  };
  return (
    <Modal
      leaving={leaving}
      size="sm"
      title={t("stack.renameTitle")}
      onClose={onClose}
      footer={<Button onClick={save}>{t("stack.save")}</Button>}
    >
      <Field label={t("stack.renameLabel")} htmlFor={id}>
        <Input
          id={id}
          // The field is the whole dialog, so the caret starts there with the old name selected to type over.
          autoFocus
          onFocus={(e) => e.currentTarget.select()}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && save()}
          placeholder={fallback}
          maxLength={80}
        />
      </Field>
    </Modal>
  );
}
