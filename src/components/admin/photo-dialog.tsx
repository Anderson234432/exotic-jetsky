"use client";

import Image from "next/image";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export function PhotoDialog({
  url,
  onClose,
  titulo,
}: {
  url: string | null;
  onClose: () => void;
  titulo: string;
}) {
  return (
    <Dialog open={!!url} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogTitle>{titulo}</DialogTitle>
        {url && (
          <div className="relative h-80 w-full overflow-hidden rounded-[20px] bg-ej-agua">
            <Image src={url} alt={titulo} fill className="object-contain" />
          </div>
        )}
        <Button variant="outline" className="h-11" onClick={onClose}>
          Cerrar
        </Button>
      </DialogContent>
    </Dialog>
  );
}
