"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import { NowCard } from "./components/NowCard";
import { TimezoneSelector } from "./components/TimezoneSelector";
import { SingleTab } from "./tabs/SingleTab";
import { BatchTab, INITIAL_BATCH_STATE, type BatchState } from "./tabs/BatchTab";
import { CodeTab } from "./tabs/CodeTab";
import { JwtTab } from "./tabs/JwtTab";
import { LOCAL_TZ_VALUE } from "./constants";

export default function Timestamp() {
  const t = useTranslations("tools.developer.timestamp");
  const [tz, setTz] = useState<string>(LOCAL_TZ_VALUE);
  const [mainMs, setMainMs] = useState<number | null>(null);
  const [active, setActive] = useState("single");
  const [batchState, setBatchState] = useState<BatchState>(INITIAL_BATCH_STATE);
  const [jwtToken, setJwtToken] = useState("");

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMainMs(Date.now());
  }, []);

  return (
    <div className="space-y-5">
      <NowCard onUseNow={(ms) => { setMainMs(ms); setActive("single"); }} />

      <TimezoneSelector value={tz} onChange={setTz} />

      <Tabs value={active} onValueChange={setActive}>
        <TabsList aria-label="Timestamp tools">
          <TabsTrigger value="single">{t("tabSingle")}</TabsTrigger>
          <TabsTrigger value="batch">{t("tabBatch")}</TabsTrigger>
          <TabsTrigger value="code">{t("tabCode")}</TabsTrigger>
          <TabsTrigger value="jwt">{t("tabJwt")}</TabsTrigger>
        </TabsList>

        <TabsContent value="single">
          <SingleTab tz={tz} mainMs={mainMs} setMainMs={setMainMs} />
        </TabsContent>
        <TabsContent value="batch">
          <BatchTab tz={tz} state={batchState} onStateChange={setBatchState} />
        </TabsContent>
        <TabsContent value="code">
          <CodeTab mainMs={mainMs} />
        </TabsContent>
        <TabsContent value="jwt">
          <JwtTab tz={tz} token={jwtToken} onTokenChange={setJwtToken} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
