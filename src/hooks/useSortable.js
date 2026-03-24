import { useState } from "react";

const ORDINAL_MAPS = {
  priorite: { "Haute":1, "Moyenne":2, "Basse":3 },
  statut_service: { "Rupture":1, "Sous seuil":2, "Conforme":3 },
  abc: { "A":1, "B":2, "C":3 },
  statut: { "BROUILLON":1, "A_VALIDER":2, "ENVOYE":3, "RECU":4, "CLOS":5 },
  level: { "CRITICAL":1, "ERROR":2, "WARNING":3, "INFO":4 },
  status: { "Ouverte":1, "En cours":2, "Terminée":3 },
  old_status: { "BROUILLON":1, "A_VALIDER":2, "ENVOYE":3, "RECU":4, "CLOS":5 },
  new_status: { "BROUILLON":1, "A_VALIDER":2, "ENVOYE":3, "RECU":4, "CLOS":5 },
};

export const useSortable = (defaultCol = null, defaultDir = "desc") => {
  const [sortCol, setSortCol] = useState(defaultCol);
  const [sortDir, setSortDir] = useState(defaultDir);

  const handleSort = (col) => {
    if (sortCol === col) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortCol(col); setSortDir("desc"); }
  };

  const sortData = (data, accessor) => {
    if (!sortCol) return data;
    const ordMap = ORDINAL_MAPS[sortCol];
    return [...data].sort((a, b) => {
      let va = accessor ? accessor(a, sortCol) : a[sortCol];
      let vb = accessor ? accessor(b, sortCol) : b[sortCol];
      if (va == null && vb == null) return 0;
      if (va == null) return 1;
      if (vb == null) return -1;
      if (ordMap) {
        va = ordMap[va] ?? 999;
        vb = ordMap[vb] ?? 999;
        return sortDir === "asc" ? va - vb : vb - va;
      }
      if (typeof va === "string" && typeof vb === "string") {
        return sortDir === "asc" ? va.localeCompare(vb) : vb.localeCompare(va);
      }
      return sortDir === "asc" ? (va > vb ? 1 : -1) : (va < vb ? 1 : -1);
    });
  };

  return { sortCol, sortDir, handleSort, sortData };
};
