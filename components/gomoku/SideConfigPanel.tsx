import type { EffectiveSideConfig, MoveHistoryItem, SideConfigInput } from "../../lib/gomoku/types";
import { DEFAULT_BASE_URL, DEFAULT_MODEL } from "../../lib/gomoku/types";

interface SideConfigPanelProps {
  sideName: string;
  config: SideConfigInput;
  effective: EffectiveSideConfig;
  thoughts: MoveHistoryItem[];
  isThinking: boolean;
  onChange: (patch: Partial<SideConfigInput>) => void;
}

export function SideConfigPanel({
  sideName,
  config,
  effective,
  onChange,
  thoughts,
  isThinking,
}: SideConfigPanelProps) {
  return (
    <section className="sidePanel">
      <h2>{sideName} AI</h2>

      <p className={`ready ${effective.ready ? "ok" : "bad"}`}>
        {effective.ready ? "已就绪" : "未就绪"}
      </p>

      <p className="source">配置来源：仅当前面板输入</p>

      <label>
        API URL
        <input
          value={config.apiUrl}
          onChange={(event) => onChange({ apiUrl: event.target.value })}
          placeholder={DEFAULT_BASE_URL}
        />
      </label>

      <label>
        模型
        <input
          value={config.model}
          onChange={(event) => onChange({ model: event.target.value })}
          placeholder={DEFAULT_MODEL}
        />
      </label>

      <label>
        API Key
        <input
          type="password"
          autoComplete="new-password"
          value={config.apiKey}
          onChange={(event) => onChange({ apiKey: event.target.value })}
          placeholder="sk-..."
        />
      </label>

      <p className="hint">按阵营共享：黑方一套、白方一套（跨五子棋/象棋同步）。</p>

      <div className="thoughtSection">
        <h3>思考过程</h3>
        {isThinking ? <p className="thinkingNow">正在思考...</p> : null}

        {thoughts.length === 0 ? (
          <p className="emptyThought">暂无思考记录</p>
        ) : (
          <div className="thoughtList">
            {thoughts.map((item) => (
              <article key={`${item.turn}-${item.row}-${item.col}`} className="thoughtItem">
                <p className="thoughtHead">第 {item.turn} 手 · {item.model || "LLM"}</p>
                <p className="thoughtMove">
                  落子：({item.row}, {item.col})
                </p>
                {item.reason ? <p className="thoughtReason">理由：{item.reason}</p> : null}
                {item.thinking ? <p className="thoughtText">过程：{item.thinking}</p> : null}
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
