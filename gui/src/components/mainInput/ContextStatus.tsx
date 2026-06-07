import { useMemo, useRef } from "react";
import { useAppDispatch, useAppSelector } from "../../redux/hooks";
import { selectContextPayloadEstimateChars } from "../../redux/slices/sessionSlice";
import { saveCurrentSession } from "../../redux/thunks/session";
import { useCompactConversation } from "../../util/compactConversation";
import { ToolTip } from "../gui/Tooltip";

function formatApproxChars(charCount: number): string {
  if (charCount < 1000) {
    return `${charCount}`;
  }

  if (charCount < 10000) {
    return `${(charCount / 1000).toFixed(1).replace(/\.0$/, "")}k`;
  }

  return `${Math.round(charCount / 1000)}k`;
}

const ContextStatus = () => {
  const dispatch = useAppDispatch();
  const contextPercentage = useAppSelector(
    (state) => state.session.contextPercentage,
  );
  const contextPayloadEstimateChars = useAppSelector(
    selectContextPayloadEstimateChars,
  );
  const selectedChatModel = useAppSelector(
    (state) => state.config.config.selectedModelByRole.chat?.model,
  );
  const previousHistoryLength = useRef<number | null>(null);
  const previousSelectedChatModel = useRef<string | null>(null);
  const history = useAppSelector((state) => state.session.history);
  const percent = Math.round((contextPercentage ?? 0) * 100);
  const isPruned = useAppSelector((state) => state.session.isPruned);
  const showContextPayloadInfo =
    typeof window !== "undefined" && window.showContextPayloadInfo === true;

  const isDifferentModelAndSameHistory = useMemo(() => {
    if (!selectedChatModel) return false;
    // only reset if history changes
    if (previousHistoryLength.current !== history.length) {
      previousHistoryLength.current = history.length;
      previousSelectedChatModel.current = selectedChatModel;
      return false;
    }
    return previousSelectedChatModel.current !== selectedChatModel;
  }, [history.length, selectedChatModel]);

  const compactConversation = useCompactConversation();
  const shouldShowContextStatus = isPruned || percent >= 60;

  if (!shouldShowContextStatus && !showContextPayloadInfo) {
    return null;
  }

  // if user changed to a different model, we shouldn't show the context status until the user sends a new message
  if (isDifferentModelAndSameHistory) {
    return null;
  }

  const barColorClass = isPruned ? "bg-error" : "bg-description";
  const payloadEstimateText = `~${formatApproxChars(contextPayloadEstimateChars)} chars`;

  return (
    <div className="flex items-center gap-1">
      {shouldShowContextStatus && (
        <ToolTip
          closeEvents={{
            // blur: false,
            mouseleave: true,
            click: true,
            mouseup: false,
          }}
          clickable
          content={
            <div className="flex flex-col gap-0 text-left text-xs">
              <span className="inline-block">
                {`${percent}% of context filled.`}
              </span>
              {showContextPayloadInfo && (
                <span className="inline-block">{`Approximate chars in the latest context payload: ${payloadEstimateText}.`}</span>
              )}
              {isPruned && (
                <span className="inline-block">
                  {`Oldest messages are being removed.`}
                </span>
              )}
              {history.length > 0 && (
                <div className="flex flex-col gap-1 whitespace-pre">
                  <div>
                    <span
                      className="hover:text-link inline-block cursor-pointer underline"
                      onClick={() => compactConversation(history.length - 1)}
                    >
                      Compact conversation
                    </span>
                    {"\n"}
                    <span
                      className="hover:text-link inline-block cursor-pointer underline"
                      onClick={() => {
                        void dispatch(
                          saveCurrentSession({
                            openNewSession: true,
                            generateTitle: false,
                          }),
                        );
                      }}
                    >
                      Start a new session
                    </span>
                  </div>
                </div>
              )}
            </div>
          }
        >
          <div className="border-command-border relative h-[14px] w-[7px] rounded-[1px] border-[0.5px] border-solid md:h-[10px] md:w-[5px]">
            <div
              className={`transition-height absolute bottom-0 left-0 w-full duration-300 ease-in-out ${barColorClass}`}
              style={{ height: `${percent}%` }}
            />
          </div>
        </ToolTip>
      )}
      {showContextPayloadInfo && (
        <span className="text-description-muted whitespace-nowrap text-[10px] leading-none">
          {`payload ${payloadEstimateText}`}
        </span>
      )}
    </div>
  );
};

export default ContextStatus;
