import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Trash2 } from "lucide-react";
import { type Preset } from "@/lib/presets";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { IconButton } from "@/components/ui/icon-button";

/** Save the current filter/sort as a named preset and manage existing ones. */
export default function PresetModal({
  leaving,
  presets,
  onSave,
  onDelete,
  onClose,
}: {
  /** On its way out — supplied by `Presence`. */
  leaving?: boolean;
  presets: Preset[];
  onSave: (name: string) => void;
  onDelete: (name: string) => void;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const [name, setName] = useState("");

  const save = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    onSave(trimmed);
    setName("");
  };

  return (
    <Modal title={t("presets.title")} onClose={onClose} leaving={leaving}>
      <div className="space-y-4">
        <div className="flex gap-2">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && save()}
            placeholder={t("presets.namePlaceholder")}
          />
          <Button onClick={save} disabled={!name.trim()}>
            {t("common.save")}
          </Button>
        </div>

        {presets.length > 0 && (
          <ul className="divide-y divide-surface-800 rounded-control border border-hair">
            {presets.map((p) => (
              <li
                key={p.name}
                className="flex items-center justify-between px-3 py-1 text-sm"
              >
                <span className="truncate text-ink-100">{p.name}</span>
                <IconButton
                  size="xs"
                  onClick={() => onDelete(p.name)}
                  className="hover:text-danger"
                  aria-label={t("presets.removeNamed", { name: p.name })}
                >
                  <Trash2 className="size-3.5" />
                </IconButton>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Modal>
  );
}
