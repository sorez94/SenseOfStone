"use client";

import { ArrowDown, ArrowUp, ImagePlus, Link2, Trash2 } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useId, useRef, useState } from "react";
import { useFieldArray, useFormContext } from "react-hook-form";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/form-controls";
import { useApiErrorMessage } from "@/hooks/use-api-error";
import { useServices } from "@/providers/services-context";
import type { ProductFormValues } from "../../product-form-model";

/** Upload, order, remove and describe product images. The first image is the cover. */
export function ImageManager() {
  const t = useTranslations("admin.productForm");
  const tCommon = useTranslations("common");
  const { admin } = useServices();
  const errorMessage = useApiErrorMessage();
  const { control, register, getValues } = useFormContext<ProductFormValues>();
  const { fields, append, remove, move } = useFieldArray({ control, name: "images" });
  const fileInput = useRef<HTMLInputElement>(null);
  const inputId = useId();
  const [uploading, setUploading] = useState(false);
  const [urlDraft, setUrlDraft] = useState("");

  const defaultAlt = () => ({ en: getValues("title.en"), fa: getValues("title.fa") });

  const upload = async (files: FileList | null) => {
    if (!files?.length) return;
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        try {
          const uploaded = await admin.uploadImage(file);
          append({ url: uploaded.url, alt: defaultAlt() });
        } catch (error) {
          toast.error(`${file.name}: ${errorMessage(error)}`);
        }
      }
    } finally {
      setUploading(false);
      if (fileInput.current) fileInput.current.value = "";
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <input
          ref={fileInput}
          id={inputId}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif"
          multiple
          className="sr-only"
          onChange={(event) => upload(event.target.files)}
        />
        <Button variant="outline" loading={uploading} icon={<ImagePlus className="size-4" aria-hidden />} onClick={() => fileInput.current?.click()}>
          {uploading ? t("uploading") : t("uploadImages")}
        </Button>
        <div className="flex min-w-60 flex-1 gap-2">
          <Input appearance="boxed" dir="ltr" aria-label={t("imageUrl")} placeholder="/images/products/tables/01.jpg" value={urlDraft} onChange={(e) => setUrlDraft(e.target.value)} />
          <Button
            variant="ghost"
            icon={<Link2 className="size-4" aria-hidden />}
            disabled={!urlDraft.trim()}
            onClick={() => {
              append({ url: urlDraft.trim(), alt: defaultAlt() });
              setUrlDraft("");
            }}
          >
            {t("addImageUrl")}
          </Button>
        </div>
      </div>
      <p className="text-xs text-neutral-500">{t("imageHint")}</p>

      {fields.length === 0 ? (
        <p className="rounded-lg border border-dashed border-neutral-300 p-6 text-center text-sm text-neutral-500">{t("noImages")}</p>
      ) : (
        <ol className="space-y-3">
          {fields.map((field, index) => (
            <li key={field.id} className="flex flex-col gap-3 rounded-lg border border-neutral-200 p-3 sm:flex-row sm:items-center">
              <div className="relative aspect-[3/2] w-24 shrink-0 overflow-hidden rounded-md bg-neutral-100">
                <Image src={field.url} alt="" fill sizes="96px" className="object-cover" unoptimized={field.url.startsWith("http")} />
              </div>
              <div className="grid flex-1 grid-cols-1 gap-2 sm:grid-cols-2">
                <Input appearance="boxed" dir="ltr" aria-label={`${t("altText")} (${tCommon("english")}) #${index + 1}`} placeholder={`${t("altText")} (EN)`} {...register(`images.${index}.alt.en`)} />
                <Input appearance="boxed" dir="rtl" aria-label={`${t("altText")} (${tCommon("persian")}) #${index + 1}`} placeholder={`${t("altText")} (FA)`} {...register(`images.${index}.alt.fa`)} />
              </div>
              <div className="flex items-center gap-1">
                {index === 0 ? <Badge tone="sage">{t("cover")}</Badge> : null}
                <Button variant="ghost" size="icon" className="size-8" aria-label={tCommon("moveUp")} disabled={index === 0} onClick={() => move(index, index - 1)}>
                  <ArrowUp className="size-4" aria-hidden />
                </Button>
                <Button variant="ghost" size="icon" className="size-8" aria-label={tCommon("moveDown")} disabled={index === fields.length - 1} onClick={() => move(index, index + 1)}>
                  <ArrowDown className="size-4" aria-hidden />
                </Button>
                <Button variant="ghost" size="icon" className="size-8 text-red-600 hover:bg-red-50" aria-label={tCommon("remove")} onClick={() => remove(index)}>
                  <Trash2 className="size-4" aria-hidden />
                </Button>
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
