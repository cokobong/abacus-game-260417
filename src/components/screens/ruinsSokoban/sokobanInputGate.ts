export class SokobanInputGate {
  private enabled = false;
  private completionLocked = false;
  private movementInProgress = false;

  resetForMission() {
    this.enabled = false;
    this.completionLocked = false;
    this.movementInProgress = false;
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  canMove() {
    return this.enabled && !this.completionLocked && !this.movementInProgress;
  }

  startMovement() {
    this.movementInProgress = true;
  }

  finishMovement() {
    this.movementInProgress = false;
  }

  lockForCompletion() {
    this.completionLocked = true;
  }

  isCompletionLocked() {
    return this.completionLocked;
  }
}
