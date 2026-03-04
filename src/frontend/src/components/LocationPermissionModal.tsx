import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface LocationPermissionModalProps {
  open: boolean;
  onEnableLocation: () => void;
  onCancel: () => void;
  isRequesting?: boolean;
}

export function LocationPermissionModal({
  open,
  onEnableLocation,
  onCancel,
  isRequesting = false,
}: LocationPermissionModalProps) {
  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onCancel()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Location required to activate presence.</DialogTitle>
          <DialogDescription>
            We need your location to show you on the map and help you find
            nearby sport buddies.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={isRequesting}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
          <Button
            onClick={onEnableLocation}
            disabled={isRequesting}
            className="w-full sm:w-auto bg-accent hover:bg-accent/90"
          >
            {isRequesting ? "Requesting..." : "Enable Location"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
