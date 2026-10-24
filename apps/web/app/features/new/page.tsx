import { Button } from "@repo/ui/components/button";
import { Input } from "@repo/ui/components/input";
import { Label } from "@repo/ui/components/label";
import { Textarea } from "@repo/ui/components/textarea";

import { submitFeatureRequest } from "@/app/_lib/features/actions";

export default function NewFeaturePage() {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-medium">Submit a feature request</h1>
        <p className="text-muted-foreground text-sm">
          Share the problem and desired outcome. After submission you can run AI
          triage and confirm grouping before prioritization.
        </p>
      </div>
      <form action={submitFeatureRequest} className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="title">Title</Label>
          <Input id="title" name="title" placeholder="Short summary" required />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            name="description"
            placeholder="What problem does this solve? Who is affected?"
            required
            rows={6}
          />
        </div>
        <Button type="submit">Submit request</Button>
      </form>
    </div>
  );
}
