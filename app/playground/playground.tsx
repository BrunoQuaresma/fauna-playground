"use client";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import clsx from "clsx";
import {
  AlertCircleIcon,
  DatabaseIcon,
  FileIcon,
  PlayIcon,
  PlusIcon,
  XIcon,
} from "lucide-react";
import {
  Fragment,
  memo,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import { twMerge } from "tailwind-merge";
import hotkeys from "hotkeys-js";
import prettier from "prettier/standalone";
import parserBabel from "prettier/parser-babel";
import Prism from "prismjs";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { QueryFailure, QuerySuccess } from "fauna";
import { RemoveConnectionButton } from "../remove-connection-button";

type Tab = {
  id: string;
  label: string;
  content: string;
  result?: QuerySuccess<any> | QueryFailure;
  autoRunOnFirstTimeActive?: boolean;
};

type TabsState = {
  tabs: Tab[];
  activeTab: Tab["id"];
};

const LOCALSTORAGE_KEY = "tabs";

export function Playground({
  connection,
  collections,
}: {
  connection: string;
  collections: string[];
}) {
  const [isRunningFQL, setIsRunningFQL] = useState(false);
  const initialTabId = useId();
  const [tabsState, setTabsState] = useState<TabsState>(() => {
    const savedState = window.localStorage.getItem(LOCALSTORAGE_KEY);

    if (savedState) {
      return JSON.parse(savedState);
    }

    return {
      tabs: [{ id: initialTabId, label: "New Query", content: "" }],
      activeTab: initialTabId,
    };
  });
  const { tabs, activeTab } = tabsState;
  const selectedTab = tabs.find((tab) => tab.id === activeTab) as Tab;
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const outputCodeRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const stateToBeSaved = {
      ...tabsState,
      tabs: tabsState.tabs.map((tab) => ({
        ...tab,
        // The result can contain sensitive data so we don't want to store it
        result: undefined,
      })),
    };
    window.localStorage.setItem(
      LOCALSTORAGE_KEY,
      JSON.stringify(stateToBeSaved)
    );
  }, [tabsState]);

  const runFQL = useCallback(
    async function runFQL() {
      setIsRunningFQL(true);
      fetch("/api/fql", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: selectedTab.content,
        }),
      })
        .then((res) => res.json())
        .then((result) => {
          setTabsState((state) => {
            return {
              ...state,
              tabs: state.tabs.map((tab) =>
                tab.id === state.activeTab ? { ...tab, result } : tab
              ),
            };
          });
        })
        .finally(() => {
          setIsRunningFQL(false);
        });
    },
    [selectedTab.content]
  );

  useEffect(() => {
    textareaRef.current?.focus();

    if (selectedTab.autoRunOnFirstTimeActive) {
      runFQL();
      setTabsState((state) => {
        return {
          ...state,
          tabs: state.tabs.map((tab) =>
            tab.id === state.activeTab
              ? { ...tab, autoRunOnFirstTimeActive: false }
              : tab
          ),
        };
      });
    }
  }, [runFQL, selectedTab]);

  useEffect(() => {
    hotkeys.filter = () => true;

    hotkeys("ctrl+enter,cmd+enter", () => {
      formRef.current?.requestSubmit();
    });
  }, [tabs.length]);

  const createNewTab = useCallback(
    function createNewTab(override: Partial<Tab> = {}) {
      const newTab: Tab = {
        id: `${new Date().getTime()}`,
        label: `New Query (${tabs.length + 1})`,
        content: "",
        ...override,
      };

      setTabsState((state) => {
        // If the selected tab is empty we will use it to fill the
        // content instead of openinig a new one
        const selectedTab = state.tabs.find(
          (tab) => tab.id === state.activeTab
        ) as Tab;
        if (selectedTab.content === "") {
          const { id, ...tabData } = newTab;
          return {
            ...state,
            tabs: state.tabs.map((tab) =>
              tab.id === state.activeTab ? { ...selectedTab, ...tabData } : tab
            ),
          };
        }

        return {
          ...state,
          tabs: [...state.tabs, newTab],
          activeTab: newTab.id,
        };
      });
    },
    [tabs.length]
  );

  const openOrCreateTab = useCallback(
    function openOrCreateTab(overrideTab: Partial<Tab> = {}) {
      const existingTab = tabs.find(
        (tab) => tab.content === overrideTab.content
      );
      if (existingTab) {
        setTabsState((state) => {
          return {
            ...state,
            activeTab: existingTab.id,
          };
        });
        return;
      }

      createNewTab(overrideTab);
    },
    [createNewTab, tabs]
  );

  useEffect(() => {
    if (!outputCodeRef.current) return;

    const cleanUps = Array.from(
      outputCodeRef.current?.querySelectorAll<HTMLSpanElement>(
        "span[data-collection]"
      )
    ).map((span) => {
      const collection = span.getAttribute("data-collection") as string;
      const id = span.getAttribute("data-id") as string;

      const onClickHandler = () => {
        openOrCreateTab({
          label: `${collection} - ${id}`,
          content: `${collection}.byId("${id}")`,
          autoRunOnFirstTimeActive: true,
        });
      };

      span.addEventListener("click", onClickHandler);

      return () => {
        span.removeEventListener("click", onClickHandler);
      };
    });

    return () => {
      cleanUps.forEach((cleanUp) => cleanUp());
    };
  }, [openOrCreateTab]);

  function closeTab(tabId: string) {
    setTabsState((state) => {
      const updatedTabs = state.tabs.filter((tab) => tab.id !== tabId);
      return {
        ...state,
        tabs: updatedTabs,
        activeTab:
          state.activeTab === tabId ? updatedTabs[0].id : state.activeTab,
      };
    });
  }

  function closeOtherTabs(tabId: string) {
    setTabsState((state) => {
      return {
        ...state,
        tabs: state.tabs.filter((tab) => tab.id === tabId),
        activeTab: tabId,
      };
    });
  }

  return (
    <div className="h-full w-full grid grid-cols-[260px_1fr]">
      <div className="border-r overflow-y-auto">
        <div className="text-sm flex p-3 py-4 gap-3 items-center relative">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-50 text-indigo-950 border border-indigo-200">
            <DatabaseIcon className="w-3 h-3 flex-shrink-0" />
          </div>
          <div className="flex flex-col">
            <span className="text-xs">Connection</span>
            <span>{connection}</span>
          </div>
          <RemoveConnectionButton />
        </div>

        <div>
          <span className="px-3 text-xs block border-y py-2 bg-slate-50">
            Collections
          </span>
          <div className="flex flex-col gap-2 pt-3 pb-4">
            {collections.map((collection) => (
              <button
                key={collection}
                className="px-3 text-sm flex items-center gap-2"
                onClick={() => {
                  openOrCreateTab({
                    label: `Recent ${collection}`,
                    content: `${collection}.all().reverse()`,
                    autoRunOnFirstTimeActive: true,
                  });
                }}
              >
                <FileIcon className="h-3 w-3" />
                {collection}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-rows-[auto_1fr]">
        <div
          className="flex border-b bg-slate-50 items-center"
          role="tablist"
          aria-label="Queries tabs"
        >
          {tabs.map((tab, index) => {
            const isTheOnlyOne = tabs.length === 1;
            const canCloseTab = !isTheOnlyOne;

            return (
              <Fragment key={tab.id}>
                <ContextMenu>
                  <ContextMenuTrigger>
                    <Tab
                      first={index === 0}
                      tab={tab}
                      active={tab.id === selectedTab.id}
                      onClose={canCloseTab ? () => closeTab(tab.id) : undefined}
                      onClick={() => {
                        setTabsState((state) => {
                          return {
                            ...state,
                            activeTab: tab.id,
                          };
                        });
                      }}
                      onRename={(label) => {
                        setTabsState((state) => {
                          return {
                            ...state,
                            tabs: state.tabs.map((tab) =>
                              tab.id === state.activeTab
                                ? { ...tab, label }
                                : tab
                            ),
                          };
                        });
                      }}
                      onDrop={(dragTabId, targetTabId) => {
                        setTabsState((state) => {
                          const sortedTabs = [...state.tabs];
                          const currentTabIndex = sortedTabs.findIndex(
                            (tab) => tab.id === dragTabId
                          );
                          const targetTabIndex = sortedTabs.findIndex(
                            (tab) => tab.id === targetTabId
                          );

                          if (currentTabIndex !== -1 && targetTabIndex !== -1) {
                            const [currentTab] = sortedTabs.splice(
                              currentTabIndex,
                              1
                            );
                            sortedTabs.splice(targetTabIndex, 0, currentTab);
                          }
                          return {
                            ...state,
                            tabs: sortedTabs,
                          };
                        });
                      }}
                    />
                  </ContextMenuTrigger>
                  <ContextMenuContent>
                    <ContextMenuItem
                      disabled={isTheOnlyOne}
                      onClick={() => closeTab(tab.id)}
                    >
                      Close
                    </ContextMenuItem>
                    <ContextMenuItem
                      disabled={isTheOnlyOne}
                      onClick={() => closeOtherTabs(tab.id)}
                    >
                      Close others
                    </ContextMenuItem>
                  </ContextMenuContent>
                </ContextMenu>

                {tab.id !== activeTab && (
                  <div className="h-3 w-[1px] bg-slate-300 mr-[-1px] relative z-10" />
                )}
              </Fragment>
            );
          })}
          <button
            className="px-3 text-slate-500 hover:text-slate-900"
            type="button"
            title="Open new tab"
            aria-label="Open new tab"
            onClick={() => {
              createNewTab();
            }}
          >
            <PlusIcon className="h-3 w-3" />
          </button>
        </div>

        <div className="grid grid-cols-2">
          <form
            ref={formRef}
            onSubmit={(event) => {
              event.preventDefault();
              runFQL();
            }}
          >
            <fieldset disabled={isRunningFQL} className="h-full relative">
              <Textarea
                required
                autoFocus
                ref={textareaRef}
                placeholder="Write your FQL here..."
                name="query"
                className="border-0 h-full focus-visible:ring-0 focus-visible:ring-offset-0 rounded-none font-mono"
                value={selectedTab.content}
                onChange={(e) => {
                  setTabsState((state) => {
                    return {
                      ...state,
                      tabs: state.tabs.map((tab) =>
                        tab.id === selectedTab.id
                          ? { ...tab, content: e.target.value }
                          : tab
                      ),
                    };
                  });
                }}
              />
              <Button className="absolute bottom-5 right-5">
                <PlayIcon className="w-3 h-3 mr-2" />
                Execute FQL
              </Button>
            </fieldset>
          </form>

          <div className="border-l flex flex-col">
            {selectedTab.result ? (
              <>
                {"error" in selectedTab.result && (
                  <div
                    role="alert"
                    className="bg-red-50 text-xs p-4 py-3 border-b border-b-red-100 text-red-950 flex items-center gap-2"
                  >
                    <AlertCircleIcon className="w-3 h-3 text-red-500" />
                    An error occurred while running your FQL
                  </div>
                )}
                {selectedTab.result.stats && (
                  <div className="p-4 py-3 border-b text-xs flex items-start gap-4 text-slate-600">
                    <div className="flex gap-1">
                      <span className="font-medium">Query time:</span>
                      {selectedTab.result.stats.query_time_ms.toLocaleString(
                        undefined,
                        { maximumFractionDigits: 0 }
                      )}{" "}
                      ms
                    </div>
                    <div className="flex gap-1">
                      <span className="font-medium">Compute:</span>
                      {selectedTab.result.stats.compute_ops.toLocaleString()}
                    </div>
                    <div className="flex gap-1">
                      <span className="font-medium">Reads:</span>
                      {selectedTab.result.stats.read_ops.toLocaleString()} -{" "}
                      {formatBytes(selectedTab.result.stats.storage_bytes_read)}
                    </div>
                    <div className="flex gap-1">
                      <span className="font-medium">Writes:</span>
                      {selectedTab.result.stats.write_ops.toLocaleString()} -{" "}
                      {formatBytes(
                        selectedTab.result.stats.storage_bytes_write
                      )}
                    </div>
                  </div>
                )}
                <Highlight
                  codeRef={outputCodeRef}
                  fqlResult={
                    "data" in selectedTab.result
                      ? selectedTab.result.data
                      : selectedTab.result
                  }
                />
              </>
            ) : isRunningFQL ? (
              <div className="w-full h-full flex items-center justify-center">
                <LoaderSpinner />
              </div>
            ) : (
              <div className="w-full h-full flex items-center justify-center p-6">
                <div className="flex flex-col gap-1">
                  <h3 className="font-semibold text-xl">
                    Run a FQL query to see the results here
                  </h3>
                  <a
                    href=""
                    className="text-indigo-600 font-medium hover:underline w-fit"
                  >
                    Check the docs
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Tab({
  tab,
  active,
  first,
  onClick,
  onDrop,
  onClose,
  onRename,
}: {
  tab: Tab;
  active: Boolean;
  first: Boolean;
  onClick: () => void;
  onDrop: (dragTabId: string, targetTabId: string) => void;
  onClose?: () => void;
  onRename: (newLabel: string) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [renameValue, setRenameValue] = useState(tab.label);

  return (
    <div
      role="tab"
      aria-selected={Boolean(active)}
      id={`tab-${tab.id}`}
      tabIndex={0}
      title={`Open tab ${tab.label}`}
      className={twMerge(
        clsx(
          { active: active },
          `group select-none overflow-hidden flex items-center gap-2 cursor-pointer py-3 px-3 text-xs text-slate-500 hover:text-slate-900  border-slate-50 border-r mr-[-1px]`,
          {
            "bg-white text-slate-900 border-slate-200 relative after:w-full after:bg-indigo-500 after:left-0 after:bottom-0 after:h-[1px] after:block after:content-[''] after:absolute z-10 after:z-10":
              active,
            "border-l": !first,
          }
        )
      )}
      onClick={onClick}
      onDoubleClick={() => {
        setIsEditing(true);
      }}
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("dragTabId", tab.id);
      }}
      onDragOver={(e) => {
        e.preventDefault();
        e.currentTarget.classList.add("bg-blue-50", "text-slate-900");
      }}
      onDragLeave={(e) => {
        e.currentTarget.classList.remove("bg-blue-50", "text-slate-900");
      }}
      onDrop={(e) => {
        e.preventDefault();
        const dragTabId = e.dataTransfer.getData("dragTabId");
        const targetTabId = tab.id;
        onDrop(dragTabId, targetTabId);
        e.currentTarget.classList.remove("bg-blue-50", "text-slate-900");
      }}
    >
      <FileIcon className="w-3 h-3 flex-shrink-0" />
      {isEditing ? (
        <input
          name="label"
          required
          autoFocus
          value={renameValue}
          onChange={(e) => setRenameValue(e.currentTarget.value)}
          className="focus:outline-none"
          size={renameValue.length}
          onBlur={(e) => {
            setIsEditing(false);
            onRename(e.currentTarget.value);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              e.stopPropagation();
              setIsEditing(false);
              onRename(e.currentTarget.value);
            }
            if (e.key === "Escape") {
              e.preventDefault();
              e.stopPropagation();
              setIsEditing(false);
              setRenameValue(tab.label);
            }
          }}
        />
      ) : (
        <span className="block whitespace-nowrap overflow-hidden text-ellipsis w-full">
          {tab.label}
        </span>
      )}
      {!isEditing && onClose && (
        <button
          type="button"
          aria-label={`Close tab ${tab.label}`}
          title={`Close tab ${tab.label}`}
          className={twMerge(
            clsx(
              "text-slate-50 group-hover:text-slate-500 hover:!text-slate-900 flex-shrink-0",
              {
                "text-slate-500": active,
              }
            )
          )}
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
        >
          <XIcon className="w-3 h-3" />
        </button>
      )}
    </div>
  );
}

function LoaderSpinner() {
  return (
    <svg
      aria-hidden="true"
      className="w-8 h-8 mr-2 text-gray-200 animate-spin dark:text-gray-600 fill-indigo-500"
      viewBox="0 0 100 101"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
        fill="currentColor"
      />
      <path
        d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
        fill="currentFill"
      />
    </svg>
  );
}

Prism.hooks.add("wrap", function (env) {
  if (env.type === "string" && env.content.startsWith(`"collection:`)) {
    const [_, collection, id] = env.content.replace(/"/g, "").split(":");
    env.attributes["data-collection"] = collection;
    env.attributes["data-id"] = id;
    env.content = `"${id}"`;
    env.classes.push("font-bold cursor-pointer hover:underline");
  }
});

const Highlight = memo(function Highlight({
  codeRef,
  fqlResult,
}: {
  codeRef: React.RefObject<HTMLElement>;
  fqlResult: Record<string, any>;
}) {
  const isError = "error" in fqlResult;
  const htmlCode = isError
    ? Prism.highlight(
        JSON.stringify(fqlResult, null, 2),
        Prism.languages.javascript,
        "javascript"
      )
    : Prism.highlight(
        prettier
          .format(`return ${jsonToFQL(fqlResult)}`, {
            parser: "babel",
            plugins: [parserBabel],
            semi: false,
          })
          .replace("return ", ""),
        Prism.languages.javascript,
        "javascript"
      );

  return (
    <pre
      style={{
        // We need to find a better way to control the height for vertical scrolling.
        // 81px is - 41 from the tabs height + 41 from the stats height or error alert
        maxHeight: "calc(100vh - 82px)",
      }}
      className="w-full h-full p-4 overflow-y-auto"
    >
      <code
        className="language-fql text-sm"
        ref={codeRef}
        dangerouslySetInnerHTML={{
          __html: htmlCode,
        }}
      />
    </pre>
  );
});

function jsonToFQL(json: Record<string, any>) {
  const values: string = Object.entries(json).reduce((acc, [key, value]) => {
    if (typeof value === "string") {
      return `${acc} ${key}: "${value}",`;
    }

    if (typeof value === "number") {
      return `${acc} ${key}: ${value},`;
    }

    if (typeof value === "boolean") {
      return `${acc} ${key}: ${value},`;
    }

    if (Array.isArray(value)) {
      return `${acc} ${key}: [${value.map(jsonToFQL)}],`;
    }

    if (key === "coll") {
      return `${acc} ${key}: ${value.name},`;
    }

    if (typeof value === "object") {
      if (Object.keys(value).length === 0) {
        return acc;
      }

      if ("isoString" in value) {
        return `${acc} ${key}: Time("${value.isoString}"),`;
      }

      if ("coll" in value) {
        // This uses a template coll:id to be able to click on it later
        return `${acc} ${key}: ${value.coll.name}.byId("collection:${value.coll.name}:${value.id}"),`;
      }

      return `${acc} ${key}: ${jsonToFQL(value)},`;
    }

    console.warn("Unknown type", typeof value, value);
    return acc;
  }, "");

  return `{${values}}`;
}

function formatBytes(bytes: number): string {
  const units = ["bytes", "KB", "MB", "GB"];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  if (size === 0) {
    return "0";
  }

  return `${size.toFixed(0)} ${units[unitIndex]}`;
}
