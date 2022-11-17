import CssBaseline from "@mui/material/CssBaseline";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import {
  Button,
  Card,
  CardContent,
  CardMedia,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemText,
  Modal,
  Paper,
  Stack,
  TextField,
  Typography,
  LinearProgress
} from "@mui/material";
import isURL from "validator/lib/isURL";
import React, { ChangeEvent, useEffect, useState } from "react";

interface OgInfo {
  og_image: string;
  og_url: string;
  url_match: boolean;
}
interface ScrapResult {
  url: string;
  response_status: number;
  h_location: string;
  html: string;
  og_info?: OgInfo;
}
interface ScrapActionProp {
  v: ScrapResult;
  i: number;
  isLast: boolean;
  onHtmlClick?: () => void;
}

const EmptyImage = () => {
  return (
    <svg
      id="noimage"
      width="100%"
      height="140"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Placeholder: Image cap"
      preserveAspectRatio="xMidYMid slice"
      focusable="false"
    >
      <title>Placeholder</title>
      <rect width="100%" height="100%" fill="#868e96"></rect>
      <text x="41.5%" y="50%" fill="#dee2e6" dy=".3em">
        No Image
      </text>
    </svg>
  );
};

const ScrapAction = (prop: ScrapActionProp) => {
  const [hint, setHint] = useState<String>("");

  useEffect(() => {
    const hasRedirect =
      prop.v.response_status >= 300 && prop.v.response_status < 400;
    const hasMissMatch = prop.v.og_info && prop.v.og_info.url_match === false;
    const needRedirect = hasRedirect || hasMissMatch;
    let text = "완료";
    if (prop.i === 3 && needRedirect) {
      text = "최대 수집 시도 횟수 도닱";
    } else {
      if (prop.isLast) {
        if (hasMissMatch) {
          text = "완료[중복실행멈춤]";
        }
      } else {
        if (hasRedirect) {
          text = "리디렉션";
        } else if (hasMissMatch) {
          text =
            "og:url 에서 다시 수집 [사유 :og:image와 og:url의 도메인이 같지 않음]";
        }
      }
    }
    setHint(text);
  }, [prop]);

  return (
    <>
      <ListItem
        secondaryAction={
          <div>
            <Button
              size="small"
              onClick={prop.onHtmlClick}
              sx={{ padding: "0px 8px", minWidth: "0px" }}
            >
              HTML
            </Button>
            <Chip
              size="small"
              sx={{
                padding: "0px 0px",
                borderRadius: 0
              }}
              label={prop.v.response_status}
              color={prop.v.response_status < 300 ? "success" : "warning"}
            />
          </div>
        }
      >
        <ListItemText
          primary={"► " + prop.v.url}
          secondary={
            prop.v.og_info ? (
              <>
                <span>[og:image] {prop.v.og_info.og_image}</span>
                <br />
                <span>[og:url] {prop.v.og_info.og_url}</span>
              </>
            ) : null
          }
        />
      </ListItem>
      <ListItem>
        <Chip label={hint} size="small" sx={{ width: "100%" }} />
      </ListItem>
      {prop.isLast ? null : <Divider />}
    </>
  );
};

export default function App() {
  const [url, setUrl] = useState<string>("https://developers.kakao.com");
  const [urlValid, setUrlValid] = useState<boolean>(true);
  const [scraps, setScraps] = useState<ScrapResult[]>([]);
  const [lastScrap, setLastScrap] = useState<ScrapResult>();
  const [html, setHtml] = useState<string>();
  const [modal, setModal] = useState<boolean>(false);
  const [onFetch, setOnFetch] = useState<boolean>(false);
  const urlChange = (e: ChangeEvent<HTMLInputElement>) => {
    setUrl(e.target.value);
    setUrlValid(isURL(e.target.value));
  };
  const scrap = () => {
    setOnFetch(true);
    fetch("https://sample.chalcak.kr/scrap/go?url=" + encodeURIComponent(url))
      .then((res) => res.json())
      .then((data) => {
        setScraps(data);
        setLastScrap(data[data.length - 1]);
      })
      .finally(() => {
        setOnFetch(false);
      });
  };
  const modalView = (v: ScrapResult) => {};
  return (
    <>
      <CssBaseline />
      <Container>
        <Box sx={{ height: "100vh", padding: "16px 0px" }}>
          <Stack spacing={2}>
            <Paper elevation={0}>
              <TextField
                fullWidth
                error={!urlValid}
                label="URL"
                size="small"
                value={url}
                onChange={urlChange}
                type="url"
              />
              <Button
                variant="contained"
                size="small"
                onClick={scrap}
                sx={{ marginTop: "4px" }}
                disabled={!urlValid}
              >
                스크랩 경로 디버깅
              </Button>
            </Paper>
            {onFetch ? <LinearProgress /> : null}
            <Paper elevation={2}>
              <List dense={true}>
                {scraps.map((v, i) => {
                  return (
                    <ScrapAction
                      key={i}
                      v={v}
                      i={i}
                      isLast={i === scraps.length - 1}
                      onHtmlClick={() => {
                        setHtml(v.html);
                        setModal(true);
                      }}
                    />
                  );
                })}
              </List>
            </Paper>
            <Card sx={{ maxWidth: 345 }}>
              {lastScrap?.og_info?.og_image ? (
                <CardMedia
                  component="img"
                  height="140"
                  image={lastScrap?.og_info?.og_image}
                />
              ) : (
                <EmptyImage />
              )}
              <CardContent>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ wordBreak: "break-all" }}
                >
                  {lastScrap?.og_info?.og_image}
                </Typography>
              </CardContent>
            </Card>
          </Stack>
        </Box>
      </Container>
      <Modal
        open={modal}
        onClose={() => {
          setModal(!modal);
        }}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: "90vw",
            height: "90vh",
            bgcolor: "background.paper",
            border: "2px solid #000",
            boxShadow: 24,
            wordBreak: "break-all",
            overflow: "auto",
            p: 2
          }}
        >
          {html}
        </Box>
      </Modal>
    </>
  );
}
