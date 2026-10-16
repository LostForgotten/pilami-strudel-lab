(function(){
  'use strict';
  const cssURL="data:text/css;base64,LnBpbGFtaS1jb250cm9sbGVyLXN1cmZhY2V7LS1wYy1iZzp2YXIoLS1waWxhbWktZWRpdG9yLWJnLHZhcigtLWVkaXRvci1iZywjZmZmKSk7LS1wYy10ZXh0OnZhcigtLXBpbGFtaS1lZGl0b3ItdGV4dCx2YXIoLS1lZGl0b3ItdGV4dCwjMTcyYjQyKSk7LS1wYy1hY2NlbnQ6dmFyKC0tcGlsYW1pLWFjY2VudCx2YXIoLS1hY2NlbnQsIzQ2NzZhZCkpO2NvbG9yOnZhcigtLXBjLXRleHQpO2ZvbnQ6MTRweC8xLjUgc3lzdGVtLXVpLHNhbnMtc2VyaWY7bWluLXdpZHRoOjA7d2lkdGg6MTAwJX0KLnBpbGFtaS1jb250cm9sbGVyLXN1cmZhY2UgKntib3gtc2l6aW5nOmJvcmRlci1ib3h9Ci5waWxhbWktY29udHJvbGxlci1zdXJmYWNlIGg0e2ZvbnQ6NjAwIDE1cHgvMS40IHN5c3RlbS11aSxzYW5zLXNlcmlmO2NvbG9yOmluaGVyaXQ7bWFyZ2luOjB9Ci5waWxhbWktY29udHJvbGxlci1zdXJmYWNlIGJ1dHRvbiwucGlsYW1pLWNvbnRyb2xsZXItc3VyZmFjZSBzZWxlY3QsLnBpbGFtaS1jb250cm9sbGVyLXN1cmZhY2UgaW5wdXRbdHlwZT1udW1iZXJde2JhY2tncm91bmQ6dmFyKC0tcGMtYmcpIWltcG9ydGFudDtjb2xvcjp2YXIoLS1wYy10ZXh0KSFpbXBvcnRhbnQ7Zm9udDppbmhlcml0O2JvcmRlcjoxcHggc29saWQgIzg5OTdhNzc3O2JvcmRlci1yYWRpdXM6N3B4O3BhZGRpbmc6NnB4IDhweDttYXgtd2lkdGg6MTAwJTttaW4td2lkdGg6MH0KLnBpbGFtaS1jb250cm9sbGVyLXN1cmZhY2UgYnV0dG9ue2N1cnNvcjpwb2ludGVyfQoucGlsYW1pLWNvbnRyb2xsZXItc3VyZmFjZSBidXR0b246Zm9jdXMtdmlzaWJsZSwucGlsYW1pLWNvbnRyb2xsZXItc3VyZmFjZSBpbnB1dDpmb2N1cy12aXNpYmxlLC5waWxhbWktY29udHJvbGxlci1zdXJmYWNlIHNlbGVjdDpmb2N1cy12aXNpYmxlLC5waWxhbWkteHktcGFkOmZvY3VzLXZpc2libGV7b3V0bGluZTozcHggc29saWQgdmFyKC0tcGMtYWNjZW50KTtvdXRsaW5lLW9mZnNldDoycHh9Ci5waWxhbWktY29udHJvbGxlci1zdXJmYWNlIFtoaWRkZW5de2Rpc3BsYXk6bm9uZSFpbXBvcnRhbnR9Ci5waWxhbWktYXVkaW8tYmFua3twb3NpdGlvbjpzdGlja3k7dG9wOjA7ei1pbmRleDozO2JvcmRlcjoxcHggc29saWQgIzg5OTdhNzY2O2JvcmRlci1yYWRpdXM6MTBweDtwYWRkaW5nOjE0cHg7bWFyZ2luLWJvdHRvbToxNnB4O2JhY2tncm91bmQ6dmFyKC0tcGMtYmcpfQoucGlsYW1pLWF1ZGlvLWhlYWRpbmcsLnBpbGFtaS1jb250cm9sLWhlYWRpbmd7ZGlzcGxheTpmbGV4O2p1c3RpZnktY29udGVudDpzcGFjZS1iZXR3ZWVuO2FsaWduLWl0ZW1zOmNlbnRlcjtnYXA6MTBweDtmbGV4LXdyYXA6d3JhcH0KLnBpbGFtaS1hdWRpby1oZWFkaW5nIGJ1dHRvbntmb250LXNpemU6MTJweH0ucGlsYW1pLWNvbnRyb2wtaGVscHtmb250LXNpemU6MTJweDtvcGFjaXR5Oi44O2xpbmUtaGVpZ2h0OjEuNTttYXJnaW46OHB4IDAgMH0KLnBpbGFtaS1hdWRpby1zb3VyY2Vze2Rpc3BsYXk6ZmxleDtmbGV4LXdyYXA6d3JhcDtnYXA6OHB4O21hcmdpbjoxMnB4IDB9Ci5waWxhbWktY29udHJvbGxlci1zdXJmYWNlIGJ1dHRvbi5waWxhbWktYXVkaW8tc291cmNle2Rpc3BsYXk6ZmxleDtmbGV4OjE7bWluLXdpZHRoOjgwcHg7ZmxleC1kaXJlY3Rpb246Y29sdW1uO2dhcDo2cHg7cGFkZGluZzo5cHg7Y3Vyc29yOmdyYWJ9Ci5waWxhbWktYXVkaW8tc291cmNlIHNwYW57Zm9udDoxMnB4IHVpLW1vbm9zcGFjZSxDb25zb2xhcyxtb25vc3BhY2V9LnBpbGFtaS1hdWRpby1zb3VyY2UgbWV0ZXJ7d2lkdGg6MTAwJTtoZWlnaHQ6MTJweDthY2NlbnQtY29sb3I6dmFyKC0tcGMtYWNjZW50KX0KLnBpbGFtaS1hdWRpby1zb3VyY2UuaXMtdW5hdmFpbGFibGV7b3BhY2l0eTouNTV9LnBpbGFtaS1jb250cm9sbGVyLXN1cmZhY2UgYnV0dG9uLnBpbGFtaS1hdWRpby1zb3VyY2UuaXMtc2VsZWN0ZWR7Ym9yZGVyLWNvbG9yOnZhcigtLXBjLWFjY2VudCk7Ym94LXNoYWRvdzowIDAgMCAycHggdmFyKC0tcGMtYWNjZW50KX0KLnBpbGFtaS1jb250cm9sLWdyaWR7ZGlzcGxheTpncmlkO2dyaWQtdGVtcGxhdGUtY29sdW1uczpyZXBlYXQoYXV0by1maXQsbWlubWF4KG1pbigxMDAlLDI2MHB4KSwxZnIpKTtnYXA6MTJweDthbGlnbi1pdGVtczpzdGFydH0KLnBpbGFtaS1jb250cm9sLWNhcmQsLnBpbGFtaS14eS1jYXJke21pbi13aWR0aDowO3BhZGRpbmc6MTRweDtib3JkZXI6MXB4IHNvbGlkICM4OTk3YTc2Njtib3JkZXItcmFkaXVzOjEwcHg7YmFja2dyb3VuZDp2YXIoLS1wYy1iZyk7c2Nyb2xsLW1hcmdpbi10b3A6MjIwcHh9Ci5waWxhbWktY29udHJvbC1kZXN0aW5hdGlvbntmb250LXdlaWdodDo2MDAhaW1wb3J0YW50O3RleHQtYWxpZ246bGVmdDtvdmVyZmxvdy13cmFwOmFueXdoZXJlO2JvcmRlci1jb2xvcjp0cmFuc3BhcmVudCFpbXBvcnRhbnQ7cGFkZGluZy1sZWZ0OjAhaW1wb3J0YW50fQoucGlsYW1pLWNvbnRyb2wtaGVhZGluZyBzZWxlY3R7Zm9udC1zaXplOjExcHg7bWF4LXdpZHRoOjE1MHB4fS5waWxhbWktY29udHJvbC12YWx1ZXtkaXNwbGF5OmZsZXg7YWxpZ24taXRlbXM6Y2VudGVyO2dhcDoxMnB4O21pbi1oZWlnaHQ6NDhweDttYXJnaW4tdG9wOjEwcHh9Ci5waWxhbWktY29udHJvbC12YWx1ZSBpbnB1dFt0eXBlPXJhbmdlXXtmbGV4OjE7bWluLXdpZHRoOjA7d2lkdGg6MTAwJTthY2NlbnQtY29sb3I6dmFyKC0tcGMtYWNjZW50KTtwYWRkaW5nOjA7YmFja2dyb3VuZDp0cmFuc3BhcmVudDtjdXJzb3I6cG9pbnRlcn0KLnBpbGFtaS1jb250cm9sLXZhbHVlIG91dHB1dHtmb250LXZhcmlhbnQtbnVtZXJpYzp0YWJ1bGFyLW51bXM7Zm9udDoxM3B4IHVpLW1vbm9zcGFjZSxDb25zb2xhcyxtb25vc3BhY2U7bWluLXdpZHRoOjU1cHg7dGV4dC1hbGlnbjpyaWdodDttYXJnaW4tbGVmdDphdXRvfQoucGlsYW1pLWNvbnRyb2wtdmFsdWUgaW5wdXQucGlsYW1pLWNvbnRyb2wtbnVtYmVye2ZsZXg6MCAxIDEwMHB4O3dpZHRoOjEwMHB4O21pbi13aWR0aDo2NHB4O21hcmdpbi1sZWZ0OmF1dG87dGV4dC1hbGlnbjpyaWdodDtmb250OjEzcHggdWktbW9ub3NwYWNlLENvbnNvbGFzLG1vbm9zcGFjZTtmb250LXZhcmlhbnQtbnVtZXJpYzp0YWJ1bGFyLW51bXM7YmFja2dyb3VuZDp2YXIoLS1wYy1iZykhaW1wb3J0YW50O2NvbG9yOnZhcigtLXBjLXRleHQpIWltcG9ydGFudDtib3JkZXI6MXB4IHNvbGlkICM4OTk3YTc3Nztib3JkZXItcmFkaXVzOjdweDtwYWRkaW5nOjZweCA4cHh9Ci5waWxhbWktY29udHJvbC12YWx1ZSBpbnB1dC5waWxhbWktY29udHJvbC1udW1iZXJbYXJpYS1pbnZhbGlkPXRydWVde2JvcmRlci1jb2xvcjojZDE2YjczfQoucGlsYW1pLWNvbnRyb2xsZXItc3VyZmFjZSBidXR0b24ucGlsYW1pLWtub2J7cG9zaXRpb246cmVsYXRpdmU7d2lkdGg6NzJweDtoZWlnaHQ6NzJweDtib3JkZXItcmFkaXVzOjUwJTtwYWRkaW5nOjA7YmFja2dyb3VuZDpyYWRpYWwtZ3JhZGllbnQoY2lyY2xlIGF0IDM1JSAyNSUsIzkxYTdiZSwjMjAzMzQ4KSFpbXBvcnRhbnQ7Ym9yZGVyOjNweCBzb2xpZCAjODk5N2E3O3RvdWNoLWFjdGlvbjpub25lO2ZsZXg6bm9uZTtjdXJzb3I6bnMtcmVzaXplfQoucGlsYW1pLWtub2ItbmVlZGxle3Bvc2l0aW9uOmFic29sdXRlO2luc2V0OjVweDt0cmFuc2Zvcm0tb3JpZ2luOmNlbnRlcn0KLnBpbGFtaS1rbm9iLW5lZWRsZTphZnRlcntjb250ZW50OicnO3Bvc2l0aW9uOmFic29sdXRlO2xlZnQ6Y2FsYyg1MCUgLSAycHgpO3RvcDowO3dpZHRoOjRweDtoZWlnaHQ6MTdweDtib3JkZXItcmFkaXVzOjJweDtiYWNrZ3JvdW5kOiNmN2ZiZmZ9Ci5waWxhbWktY29udHJvbGxlci1zdXJmYWNlIGJ1dHRvbi5waWxhbWktdG9nZ2xlW2FyaWEtY2hlY2tlZD10cnVlXXtib3JkZXItY29sb3I6dmFyKC0tcGMtYWNjZW50KTtib3gtc2hhZG93Omluc2V0IDAgMCAwIDJweCB2YXIoLS1wYy1hY2NlbnQpfQoucGlsYW1pLWNvbnRyb2wtdmFsdWUgaW5wdXQucGlsYW1pLWZhZGVye3dyaXRpbmctbW9kZTp2ZXJ0aWNhbC1scjtkaXJlY3Rpb246cnRsO3dpZHRoOjMycHg7aGVpZ2h0OjEzMHB4O2ZsZXg6MCAwIDMycHg7bWFyZ2luOjRweCBhdXRvfQoucGlsYW1pLWF1ZGlvLXJvdXRpbmd7ZGlzcGxheTpmbGV4O2FsaWduLWl0ZW1zOmNlbnRlcjtnYXA6OHB4O2ZsZXgtd3JhcDp3cmFwO2JvcmRlci10b3A6MXB4IHNvbGlkICM4OTk3YTc0NDttYXJnaW4tdG9wOjEwcHg7cGFkZGluZy10b3A6MTBweH0KLnBpbGFtaS1hdWRpby1yb3V0aW5nIGxhYmVse2Rpc3BsYXk6ZmxleDthbGlnbi1pdGVtczpjZW50ZXI7Z2FwOjZweDtmb250LXNpemU6MTJweH0ucGlsYW1pLWF1ZGlvLXJvdXRpbmcgaW5wdXRbdHlwZT1udW1iZXJde3dpZHRoOjkwcHg7Zm9udC1zaXplOjEycHh9LnBpbGFtaS1hdWRpby1yb3V0aW5nIGJ1dHRvbiwucGlsYW1pLWF1ZGlvLXJvdXRpbmcgc2VsZWN0e2ZvbnQtc2l6ZToxMnB4fQoucGlsYW1pLXh5LWNhcmR7Z3JpZC1jb2x1bW46MS8tMX0ucGlsYW1pLXh5LXpvbmVze2Rpc3BsYXk6ZmxleDtnYXA6OHB4O2ZsZXgtd3JhcDp3cmFwO21hcmdpbjoxMHB4IDB9Ci5waWxhbWktY29udHJvbGxlci1zdXJmYWNlIC5waWxhbWkteHktem9uZXMgYnV0dG9uLmhhcy1hdWRpb3tib3JkZXItY29sb3I6dmFyKC0tcGMtYWNjZW50KX0KLnBpbGFtaS14eS1wYWR7cG9zaXRpb246cmVsYXRpdmU7d2lkdGg6MTAwJTtoZWlnaHQ6MjMwcHg7b3ZlcmZsb3c6aGlkZGVuO3RvdWNoLWFjdGlvbjpub25lO2N1cnNvcjpjcm9zc2hhaXI7Ym9yZGVyOjFweCBzb2xpZCAjODk5N2E3ODg7Ym9yZGVyLXJhZGl1czo4cHg7YmFja2dyb3VuZDpsaW5lYXItZ3JhZGllbnQoIzg5OTdhNzFhIDFweCx0cmFuc3BhcmVudCAxcHgpLGxpbmVhci1ncmFkaWVudCg5MGRlZywjODk5N2E3MWEgMXB4LHRyYW5zcGFyZW50IDFweCk7YmFja2dyb3VuZC1zaXplOjEwJSAxMCV9Ci5waWxhbWkteHktcGFkOmJlZm9yZSwucGlsYW1pLXh5LXBhZDphZnRlcntjb250ZW50OicnO3Bvc2l0aW9uOmFic29sdXRlO2JhY2tncm91bmQ6Izg5OTdhNzY2O3BvaW50ZXItZXZlbnRzOm5vbmV9LnBpbGFtaS14eS1wYWQ6YmVmb3Jle3dpZHRoOjFweDtoZWlnaHQ6MTAwJTtsZWZ0OjUwJX0ucGlsYW1pLXh5LXBhZDphZnRlcntoZWlnaHQ6MXB4O3dpZHRoOjEwMCU7dG9wOjUwJX0KLnBpbGFtaS14eS1kb3QsLnBpbGFtaS14eS1iYXNle3Bvc2l0aW9uOmFic29sdXRlO3dpZHRoOjE0cHg7aGVpZ2h0OjE0cHg7dHJhbnNmb3JtOnRyYW5zbGF0ZSgtNTAlLC01MCUpO2JvcmRlci1yYWRpdXM6NTAlO3BvaW50ZXItZXZlbnRzOm5vbmV9LnBpbGFtaS14eS1kb3R7YmFja2dyb3VuZDp2YXIoLS1wYy1hY2NlbnQpO2JveC1zaGFkb3c6MCAwIDAgNHB4ICM4OTk3YTczM30ucGlsYW1pLXh5LWJhc2V7d2lkdGg6MjJweDtoZWlnaHQ6MjJweDtib3JkZXI6MXB4IGRhc2hlZCB2YXIoLS1wYy10ZXh0KX0KLnBpbGFtaS14eS1jYXJkIG91dHB1dHtkaXNwbGF5OmJsb2NrO21hcmdpbi10b3A6OHB4O2ZvbnQtdmFyaWFudC1udW1lcmljOnRhYnVsYXItbnVtcztmb250LXNpemU6MTNweH0KLnBpbGFtaS1jb250cm9sbGVyLXN1cmZhY2UgLmlzLWRyb3AtdGFyZ2V0e2JvcmRlci1jb2xvcjp2YXIoLS1wYy1hY2NlbnQpIWltcG9ydGFudDtvdXRsaW5lOjNweCBzb2xpZCB2YXIoLS1wYy1hY2NlbnQpO291dGxpbmUtb2Zmc2V0OjJweH0KQG1lZGlhKG1heC13aWR0aDo2MDBweCl7LnBpbGFtaS1hdWRpby1iYW5rLC5waWxhbWktY29udHJvbC1jYXJkLC5waWxhbWkteHktY2FyZHtwYWRkaW5nOjEwcHh9LnBpbGFtaS14eS1wYWR7aGVpZ2h0OjIwMHB4fS5waWxhbWktYXVkaW8tc291cmNlc3tkaXNwbGF5OmdyaWQ7Z3JpZC10ZW1wbGF0ZS1jb2x1bW5zOnJlcGVhdCg1LG1pbm1heCgwLDFmcikpO2dhcDo1cHh9LnBpbGFtaS1jb250cm9sbGVyLXN1cmZhY2UgYnV0dG9uLnBpbGFtaS1hdWRpby1zb3VyY2V7bWluLXdpZHRoOjAhaW1wb3J0YW50O3BhZGRpbmc6N3B4IDNweH0ucGlsYW1pLWF1ZGlvLXNvdXJjZSBzcGFue2ZvbnQtc2l6ZToxMHB4fX0KCi8qIE5hdGl2ZSBzZWxlY3QgbWVudXMgbXVzdCB1c2UgdGhlIGNvbnRyb2xsZXIgcGFsZXR0ZSwgaW5jbHVkaW5nIGRldGFjaGVkIHdpbmRvd3MuICovCi5waWxhbWktY29udHJvbGxlci1zdXJmYWNlIHNlbGVjdHtjb2xvci1zY2hlbWU6aW5oZXJpdH0KaHRtbFtkYXRhLXBpbGFtaS10aGVtZT0iZGFyayJdIC5waWxhbWktY29udHJvbGxlci1zdXJmYWNlIHNlbGVjdHtjb2xvci1zY2hlbWU6ZGFya30KaHRtbFtkYXRhLXBpbGFtaS10aGVtZT0ibGlnaHQiXSAucGlsYW1pLWNvbnRyb2xsZXItc3VyZmFjZSBzZWxlY3R7Y29sb3Itc2NoZW1lOmxpZ2h0fQoucGlsYW1pLWNvbnRyb2xsZXItc3VyZmFjZSBzZWxlY3Qgb3B0aW9uLC5waWxhbWktY29udHJvbGxlci1zdXJmYWNlIHNlbGVjdCBvcHRncm91cHtiYWNrZ3JvdW5kOnZhcigtLXBjLWJnKSFpbXBvcnRhbnQ7Y29sb3I6dmFyKC0tcGMtdGV4dCkhaW1wb3J0YW50fQoKLnBpbGFtaS1jb250cm9sLWJvdW5kc3tkaXNwbGF5OmZsZXg7YWxpZ24taXRlbXM6Y2VudGVyO2dhcDo4cHg7ZmxleC13cmFwOndyYXA7bWFyZ2luLXRvcDoxMHB4O3BhZGRpbmctdG9wOjEwcHg7Ym9yZGVyLXRvcDoxcHggc29saWQgIzg5OTdhNzQ0fQoucGlsYW1pLWNvbnRyb2wtYm91bmRzIGxhYmVse2Rpc3BsYXk6ZmxleDtmbGV4OjEgMSA4MHB4O2FsaWduLWl0ZW1zOmNlbnRlcjtnYXA6NXB4O2ZvbnQtc2l6ZToxMnB4O21pbi13aWR0aDowfQoucGlsYW1pLWNvbnRyb2wtYm91bmRzIGlucHV0W3R5cGU9bnVtYmVyXXt3aWR0aDoxMDAlO21pbi13aWR0aDowO2ZvbnQtc2l6ZToxMnB4O2ZvbnQtdmFyaWFudC1udW1lcmljOnRhYnVsYXItbnVtc30KLnBpbGFtaS1jb250cm9sLWJvdW5kcyBidXR0b257Zm9udC1zaXplOjEycHh9Ci5waWxhbWktY29udHJvbC1ib3VuZHMgLnBpbGFtaS1yYW5nZS1zdGF0dXN7ZmxleC1iYXNpczoxMDAlO21hcmdpbjowO2NvbG9yOnZhcigtLXBjLXRleHQpO29wYWNpdHk6MX0KLnBpbGFtaS1jb250cm9sLWJvdW5kcyBpbnB1dFthcmlhLWludmFsaWQ9dHJ1ZV17Ym9yZGVyLWNvbG9yOiNkMTZiNzN9CgoucGlsYW1pLXNuYXBzaG90LXBhbmVse3Bvc2l0aW9uOnN0aWNreTt0b3A6MDt6LWluZGV4OjQ7YmFja2dyb3VuZDp2YXIoLS1wYy1iZyk7Ym9yZGVyOjFweCBzb2xpZCAjODk5N2E3NjY7Ym9yZGVyLXJhZGl1czoxMHB4O3BhZGRpbmc6MTJweDttYXJnaW4tYm90dG9tOjE0cHh9Ci5waWxhbWktc25hcHNob3QtaGVhZGluZ3tkaXNwbGF5OmZsZXg7YWxpZ24taXRlbXM6Y2VudGVyO2p1c3RpZnktY29udGVudDpzcGFjZS1iZXR3ZWVuO2dhcDo4cHg7ZmxleC13cmFwOndyYXB9LnBpbGFtaS1zbmFwc2hvdC1oZWFkaW5nIC5waWxhbWktY29udHJvbC1oZWxwe21hcmdpbjowfQoucGlsYW1pLXNuYXBzaG90LXNsb3Rze2Rpc3BsYXk6Z3JpZDtncmlkLXRlbXBsYXRlLWNvbHVtbnM6cmVwZWF0KDQsbWlubWF4KDAsMWZyKSk7Z2FwOjhweDttYXJnaW46MTBweCAwfQoucGlsYW1pLXNuYXBzaG90LXNsb3R7ZGlzcGxheTpmbGV4O2ZsZXgtZGlyZWN0aW9uOmNvbHVtbjtnYXA6NHB4O21pbi13aWR0aDowfS5waWxhbWktc25hcHNob3Qtc2xvdCBidXR0b257Zm9udC1zaXplOjEycHh9Ci5waWxhbWktc25hcHNob3Qtc2xvdCBbZGF0YS1zbmFwc2hvdC1jYXB0dXJlXXtmb250LXNpemU6MTFweDtwYWRkaW5nOjNweCA2cHh9Ci5waWxhbWktc25hcHNob3Qtc2xvdCBbZGF0YS1zbmFwc2hvdC1zbG90XS5pcy1zYXZlZHtib3JkZXItY29sb3I6dmFyKC0tcGMtYWNjZW50KX0KLnBpbGFtaS1zbmFwc2hvdC1zbG90IFthcmlhLXByZXNzZWQ9dHJ1ZV17Ym94LXNoYWRvdzppbnNldCAwIDAgMCAycHggdmFyKC0tcGMtYWNjZW50KX0KLnBpbGFtaS1jb250cm9sbGVyLXN1cmZhY2UuaGFzLXNuYXBzaG90cyAucGlsYW1pLWF1ZGlvLWJhbmt7cG9zaXRpb246c3RhdGljfQoucGlsYW1pLW1vcnBoLXNldHRpbmdze2Rpc3BsYXk6ZmxleDthbGlnbi1pdGVtczpjZW50ZXI7Z2FwOjhweDtmbGV4LXdyYXA6d3JhcH0KLnBpbGFtaS1tb3JwaC1zZXR0aW5ncyBsYWJlbHtkaXNwbGF5OmZsZXg7YWxpZ24taXRlbXM6Y2VudGVyO2dhcDo1cHg7Zm9udC1zaXplOjEycHg7bWluLXdpZHRoOjB9Ci5waWxhbWktbW9ycGgtc2V0dGluZ3Mgc2VsZWN0LC5waWxhbWktbW9ycGgtc2V0dGluZ3MgYnV0dG9ue2ZvbnQtc2l6ZToxMnB4fQoucGlsYW1pLW1vcnBoLXNldHRpbmdzIC5waWxhbWktbW9ycGgtZHVyYXRpb257d2lkdGg6NjVweDtiYWNrZ3JvdW5kOnZhcigtLXBjLWJnKTtjb2xvcjp2YXIoLS1wYy10ZXh0KTtmb250OmluaGVyaXQ7Ym9yZGVyOjFweCBzb2xpZCAjODk5N2E3Nzc7Ym9yZGVyLXJhZGl1czo3cHg7cGFkZGluZzo2cHh9Ci5waWxhbWktbW9ycGgtZHVyYXRpb25bYXJpYS1pbnZhbGlkPXRydWVde2JvcmRlci1jb2xvcjojZDE2YjczIWltcG9ydGFudH0KLnBpbGFtaS1tb3JwaC1wb3NpdGlvbntkaXNwbGF5OmZsZXg7YWxpZ24taXRlbXM6Y2VudGVyO2dhcDoxMnB4O21hcmdpbi10b3A6MTBweH0KLnBpbGFtaS1tb3JwaC1wb3NpdGlvbiBpbnB1dHtmbGV4OjE7bWluLXdpZHRoOjA7d2lkdGg6MTAwJTthY2NlbnQtY29sb3I6dmFyKC0tcGMtYWNjZW50KX0KLnBpbGFtaS1tb3JwaC1wb3NpdGlvbiBvdXRwdXR7Zm9udDoxMnB4IHVpLW1vbm9zcGFjZSxDb25zb2xhcyxtb25vc3BhY2U7dGV4dC1hbGlnbjpyaWdodDttaW4td2lkdGg6OTBweH0KLnBpbGFtaS1zbmFwc2hvdC1wYW5lbCBidXR0b246ZGlzYWJsZWQsLnBpbGFtaS1zbmFwc2hvdC1wYW5lbCBpbnB1dDpkaXNhYmxlZHtvcGFjaXR5Oi41O2N1cnNvcjpkZWZhdWx0fQoucGlsYW1pLXNuYXBzaG90LXBhbmVsIC5pcy1lcnJvcntjb2xvcjojZDE2YjczfQpAbWVkaWEobWF4LXdpZHRoOjYwMHB4KXsucGlsYW1pLXNuYXBzaG90LXBhbmVse3BhZGRpbmc6MTBweH0ucGlsYW1pLXNuYXBzaG90LXNsb3Rze2dyaWQtdGVtcGxhdGUtY29sdW1uczpyZXBlYXQoMixtaW5tYXgoMCwxZnIpKX0ucGlsYW1pLXNuYXBzaG90LWhlYWRpbmcgLnBpbGFtaS1jb250cm9sLWhlbHB7Zm9udC1zaXplOjExcHh9fQoKLyogT3B0aW9uYWwgYXV0b21hdGljIG1vcnBoIGVhc2luZy4gKi8KLnBpbGFtaS1tb3JwaC1lYXNpbmd7bWFyZ2luLXRvcDo4cHh9Ci5waWxhbWktbW9ycGgtZWFzaW5nIGlucHV0W3R5cGU9Y2hlY2tib3hde3dpZHRoOmF1dG87bWluLXdpZHRoOjA7bWFyZ2luOjAgNXB4IDAgMDthY2NlbnQtY29sb3I6dmFyKC0tcGlsYW1pLWFjY2VudCwjOGRiY2U4KX0KLnBpbGFtaS1tb3JwaC1lYXNpbmcgbGFiZWx7ZGlzcGxheTppbmxpbmUtZmxleDthbGlnbi1pdGVtczpjZW50ZXI7Z2FwOjRweH0KLnBpbGFtaS1lYXNpbmctcHJldmlld3t3aWR0aDo5NnB4O2hlaWdodDo0MHB4O2ZsZXg6MCAwIDk2cHg7Ym9yZGVyOjFweCBzb2xpZCBjdXJyZW50Q29sb3I7Ym9yZGVyLXJhZGl1czo1cHg7b3BhY2l0eTouODV9Ci5waWxhbWktZWFzaW5nLWhlbHB7bWFyZ2luOjVweCAwIDB9CgovKiBNSURJIExlYXJuOiBjb21wYWN0LCBzaGFyZWQgYmV0d2VlbiBtYWluIGFuZCBkZXRhY2hlZCBjb250cm9scy4gKi8KLnBpbGFtaS1taWRpLXBhbmVse2JhY2tncm91bmQ6dmFyKC0tcGMtYmcpO2JvcmRlcjoxcHggc29saWQgIzg5OTdhNzY2O2JvcmRlci1yYWRpdXM6MTBweDtwYWRkaW5nOjEycHg7bWFyZ2luLWJvdHRvbToxNHB4fQoucGlsYW1pLW1pZGktc2V0dGluZ3N7ZGlzcGxheTpmbGV4O2dhcDo4cHg7YWxpZ24taXRlbXM6Y2VudGVyO2ZsZXgtd3JhcDp3cmFwO21hcmdpbi10b3A6OXB4fQoucGlsYW1pLW1pZGktc2V0dGluZ3MgbGFiZWx7ZGlzcGxheTpmbGV4O2dhcDo1cHg7YWxpZ24taXRlbXM6Y2VudGVyO21pbi13aWR0aDowO2ZsZXg6MSAxIDE4MHB4O2ZvbnQtc2l6ZToxMnB4fQoucGlsYW1pLW1pZGktc2V0dGluZ3Mgc2VsZWN0e21pbi13aWR0aDowO21heC13aWR0aDoxMDAlO2ZsZXg6MTtmb250LXNpemU6MTJweH0KLnBpbGFtaS1taWRpLXNldHRpbmdzIGJ1dHRvbiwucGlsYW1pLW1pZGktYmluZGluZyBidXR0b257Zm9udC1zaXplOjEycHh9Ci5waWxhbWktbWlkaS1tb25pdG9ye292ZXJmbG93LXdyYXA6YW55d2hlcmU7Zm9udC1mYW1pbHk6dWktbW9ub3NwYWNlLENvbnNvbGFzLG1vbm9zcGFjZX0KLnBpbGFtaS1taWRpLXBhbmVsIGRldGFpbHN7bWFyZ2luLXRvcDo5cHh9LnBpbGFtaS1taWRpLXBhbmVsIHN1bW1hcnl7Zm9udC1zaXplOjEycHg7Y3Vyc29yOnBvaW50ZXJ9Ci5waWxhbWktbWlkaS1iaW5kaW5nc3tkaXNwbGF5OmdyaWQ7Z2FwOjZweDttYXJnaW4tdG9wOjhweH0KLnBpbGFtaS1taWRpLWJpbmRpbmd7ZGlzcGxheTpmbGV4O2FsaWduLWl0ZW1zOmNlbnRlcjtnYXA6OHB4O2ZsZXgtd3JhcDp3cmFwO2JvcmRlci10b3A6MXB4IHNvbGlkICM4OTk3YTc0NDtwYWRkaW5nLXRvcDo2cHg7Zm9udC1zaXplOjEycHg7b3ZlcmZsb3ctd3JhcDphbnl3aGVyZX0KLnBpbGFtaS1taWRpLWJpbmRpbmc+c3BhbjpmaXJzdC1jaGlsZHtmb250LXdlaWdodDo2MDB9LnBpbGFtaS1taWRpLWJpbmRpbmcgLnBpbGFtaS1jb250cm9sLWhlbHB7bWFyZ2luOjA7ZmxleDoxIDEgMTgwcHh9Ci5waWxhbWktY29udHJvbGxlci1zdXJmYWNlIC5waWxhbWktbWlkaS1jb250cm9sLWxlYXJue21hcmdpbi10b3A6MTBweDtmb250LXNpemU6MTFweDtwYWRkaW5nOjRweCA3cHh9Ci5waWxhbWktbWlkaS1wYW5lbCAuaXMtZXJyb3J7Y29sb3I6I2QxNmI3MztvcGFjaXR5OjF9LnBpbGFtaS1taWRpLXBhbmVsIGJ1dHRvbjpkaXNhYmxlZHtvcGFjaXR5Oi41O2N1cnNvcjpkZWZhdWx0fQpAbWVkaWEobWF4LXdpZHRoOjYwMHB4KXsucGlsYW1pLW1pZGktcGFuZWx7cGFkZGluZzoxMHB4fS5waWxhbWktbWlkaS1zZXR0aW5ncyBsYWJlbHtmbGV4LWJhc2lzOjEwMCV9fQovKiBPbiBhIG5hcnJvdyBvciBzaG9ydCBzY3JlZW4sIGxlYXZlIHJvb20gdG8gc2Nyb2xsIHRvIE1JREkgYW5kIHBhcmFtZXRlcnMuICovCkBtZWRpYShtYXgtd2lkdGg6NjAwcHgpLChtYXgtaGVpZ2h0OjY1MHB4KXsucGlsYW1pLXNuYXBzaG90LXBhbmVse3Bvc2l0aW9uOnN0YXRpY319Cg==";
  const MIME='application/x-pilami-audio-band';
  const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
  const number=value=>String(Math.round(value*1e6)/1e6);
  function audioLevel(band){const level=Number(window.PilamiStrudelHydra.audio()?.fft[band]);return Number.isFinite(level)?clamp(level,0,1):0;}
  function validateAudio(options){
    if(!options||!Number.isInteger(options.band)||options.band<0||options.band>15||!Number.isFinite(options.depth))throw new Error('audioMod : band de 0 à 15 et depth numérique requis.');
    return {band:options.band,depth:options.depth};
  }
  function value(entry){const result=clamp(entry.value+(entry.audio?audioLevel(entry.audio.band)*entry.audio.depth:0),entry.min,entry.max);return entry.kind==='toggle'?(result>=(entry.min+entry.max)/2?entry.max:entry.min):result;}
  function create({source,parsed,entries,pairs,active,write,say,snapshotContext}){
    let alive=true;const listeners=new Set();
    const available=()=>alive&&active();
    const notify=()=>listeners.forEach(listener=>listener());
    function code(){
      const edits=entries.map(entry=>{
        let call=source.slice(entry.callFrom,entry.callTo);
        // Apply edits against original AST offsets, preserving comments, the step
        // expression and other arguments through repeated live changes.
        const args=entry.args||[],values=entry.stepEdited?[entry.value,entry.min,entry.max,entry.step==='any'?'undefined':entry.step]:entry.rangeEdited?[entry.value,entry.min,entry.max]:[entry.value],changes=[];
        values.forEach((next,index)=>{if(args[index])changes.push({...args[index],text:String(next)});});
        if(args.length<values.length){
          const last=args[args.length-1],at=last?last.to:entry.callTo-1;
          changes.push({from:at,to:at,text:(last?', ':'')+values.slice(args.length).join(', ')});
        }
        for(const edit of changes.sort((a,b)=>b.from-a.from||b.to-a.to))call=call.slice(0,edit.from-entry.callFrom)+edit.text+call.slice(edit.to-entry.callFrom);
        call=entry.kind+call.slice(entry.calleeTo-entry.callFrom);
        if(entry.kind!==entry.declaredKind&&(entry.kind==='toggle'||entry.declaredKind==='toggle'))call=entry.kind+'('+entry.value+', '+entry.min+', '+entry.max+', '+(entry.step==='any'?'undefined':entry.step)+')';
        const body=source.slice(entry.bodyFrom,entry.callFrom)+call+source.slice(entry.callTo,entry.bodyTo);
        return {from:entry.replaceFrom,to:entry.replaceTo,text:entry.audio?'audioMod('+body+', {band: '+entry.audio.band+', depth: '+String(entry.audio.depth)+'})':body};
      });
      const required=Math.max(0,...entries.filter(e=>e.audio).map(e=>e.audio.band+1));
      parsed.bins.forEach(bin=>{if(bin.value<required)edits.push({...bin,text:String(required)});});
      let output=source,previous=Infinity;
      for(const edit of edits.sort((a,b)=>b.from-a.from)){
        if(edit.to>previous)throw new Error('Ces contrôleurs imbriqués ne peuvent pas être édités automatiquement.');
        output=output.slice(0,edit.from)+edit.text+output.slice(edit.to);previous=edit.from;
      }
      if(new TextEncoder().encode(output).length>65536)throw new Error('Le code dépasserait 64 Ko.');
      return output;
    }
    function change(action){
      if(!available())return false;
      const before=entries.map(entry=>({entry,value:entry.value,min:entry.min,max:entry.max,rangeEdited:entry.rangeEdited,stepEdited:entry.stepEdited,kind:entry.kind,step:entry.step,sliderStep:entry.sliderStep,audio:entry.audio?{...entry.audio}:null}));
      try{action();write(code());model.snapshots?.edited();notify();return true;}
      catch(error){before.forEach(({entry,...saved})=>Object.assign(entry,saved));say(error.message,true);notify();return false;}
    }
    function quantize(entry,next){const step=Number(entry.step);return clamp(step>0?Number((entry.min+Math.round((next-entry.min)/step)*step).toPrecision(14)):next,entry.min,entry.max);}
    const pads=pairs.slice(),used=new Set(pairs.flatMap(pair=>[pair.x,pair.y]));
    entries.forEach(x=>{
      const match=x.label.match(/^(.*?)[_]?[Xx]$/);if(!match||!match[1]||used.has(x))return;
      const prefix=match[1].replace(/_$/,'');const y=entries.find(e=>e!==x&&e.label.replace(/_?[Yy]$/,'')===prefix&&/[Yy]$/.test(e.label)&&!used.has(e));
      if(y){pads.push({title:prefix.replace(/_/g,' '),x,y});used.add(x);used.add(y);}
    });
    const model={
      entries,pads,selectedBand:null,available,
      subscribe(listener){listeners.add(listener);return()=>listeners.delete(listener);},
      setBase(entry,next){return Number.isFinite(next)?change(()=>{entry.value=quantize(entry,next);}):false;},
      setMidiValues(values){return change(()=>values.forEach(({entry,value})=>{if(entries.includes(entry)&&Number.isFinite(value))entry.value=quantize(entry,value);}));},
      setRange(entry,min,max){
        if(!available())return false;
        if(entry.kind==='toggle'){say('Un interrupteur garde ses bornes 0 et 1.',true);return false;}
        if(!Number.isFinite(min)||!Number.isFinite(max)||min>=max){say('Bornes : deux nombres finis et Min < Max sont requis.',true);return false;}
        if(entry.min===min&&entry.max===max)return true;
        return change(()=>{entry.min=min;entry.max=max;entry.rangeEdited=true;entry.value=clamp(entry.value,min,max);});
      },
      setXY(pair,x,y){change(()=>{pair.x.value=quantize(pair.x,x);pair.y.value=quantize(pair.y,y);});},
      setKind(entry,kind){if(!['slider','knob','fader','toggle'].includes(kind))return;if(kind==='toggle'&&(entry.min!==0||entry.max!==1))return;change(()=>{entry.kind=kind;entry.step=kind==='toggle'?1:entry.sliderStep;if(kind==='toggle')entry.value=entry.value>=.5?1:0;});},
      async bind(targets,band){
        if(!available()||!Number.isInteger(band)||band<0||band>15)return;
        // Create the analyzer in the current renderer; the visual's phase and zoom stay intact.
        try{await window.PilamiStrudelHydra.enableControlAudio(band);if(!available())return;
          if(change(()=>targets.forEach(entry=>{entry.audio={band,depth:entry.audio?.depth??(entry.max-entry.min)*.15};}))){this.selectedBand=null;notify();say('a.fft['+band+'] lié à '+targets.map(e=>e.label).join(' + ')+'.');}
        }catch(error){say(error.message,true);}
      },
      setDepth(entry,depth){if(Number.isFinite(depth))change(()=>{if(entry.audio)entry.audio.depth=depth;});},
      unlink(entry){change(()=>{entry.audio=null;});},
      selectBand(band){this.selectedBand=this.selectedBand===band?null:band;notify();},
      captureState(){return entries.map(e=>({label:e.label,kind:e.kind,value:e.value,min:e.min,max:e.max,step:e.step,sliderStep:e.sliderStep,audio:e.audio?{...e.audio}:null}));},
      applyState(state){
        const next=window.PilamiHydraSnapshots.validateState(state,entries);
        if(!next)return false;
        return change(()=>entries.forEach((entry,index)=>{const saved=next[index];if(entry.min!==saved.min||entry.max!==saved.max)entry.rangeEdited=true;if(entry.step!==saved.step)entry.stepEdited=true;Object.assign(entry,saved);}));
      },
      dispose(){alive=false;model.midi?.dispose();model.snapshots?.dispose();listeners.clear();}
    };
    if(snapshotContext&&entries.length&&window.PilamiHydraSnapshots)model.snapshots=window.PilamiHydraSnapshots.create({model,source,context:snapshotContext,say,notify});
    if(model.snapshots&&window.PilamiHydraMidi)model.midi=window.PilamiHydraMidi.create(model);
    return model;
  }
  function element(doc,tag,text,attributes={}){const node=doc.createElement(tag);if(text!==null)node.textContent=text;Object.entries(attributes).forEach(([key,value])=>node.setAttribute(key,value));return node;}
  function mount(host,root,model){
    const doc=host.ownerDocument,win=doc.defaultView;let alive=true,frame=null,last=0,signature='',rows=[],pads=[],bankCount=0,meters=[];
    const surface=element(doc,'div',null,{class:'pilami-controller-surface'}),bank=element(doc,'section',null,{class:'pilami-audio-bank','aria-label':'Sources audio'});
    const heading=element(doc,'div',null,{class:'pilami-audio-heading'}),connect=element(doc,'button','Activer l’entrée audio',{type:'button','data-control-audio-connect':''});
    heading.append(element(doc,'h4','Sources audio'),connect);
    const hint=element(doc,'p','Glisse une bande sur un paramètre, sur X, sur Y ou sur le pad entier. Tu peux aussi cliquer la source, puis la destination.',{class:'pilami-control-help'});
    const sources=element(doc,'div',null,{class:'pilami-audio-sources'}),audioStatus=element(doc,'p','Lance un visuel pour activer l’entrée audio.',{class:'pilami-control-help','data-control-audio-status':'',role:'status'});
    bank.append(heading,hint,sources,audioStatus);
    const empty=element(doc,'p','Lance un visuel avec slider() pour afficher ses paramètres.',{'data-control-empty':'',class:'pilami-control-help'}),content=element(doc,'div',null,{class:'pilami-control-grid'});
    const snapshotHost=element(doc,'div',null,{'data-snapshot-host':''}),midiHost=element(doc,'div',null,{'data-midi-host':''});surface.append(snapshotHost,midiHost,bank,empty,content);host.replaceChildren(surface);
    const snapshotView=window.PilamiHydraSnapshots?.mount(snapshotHost,model?.snapshots),midiView=window.PilamiHydraMidi?.mount(midiHost,model?.midi);surface.classList.toggle('has-snapshots',Boolean(model?.snapshots&&model.entries.length));
    connect.addEventListener('click',async()=>{connect.disabled=true;try{await window.PilamiStrudelHydra.enableControlAudio(0,true);}catch(error){audioStatus.textContent=error.message;}finally{connect.disabled=false;refresh();}});
    function dropZone(node,targets){
      node.dataset.controlDrop=targets.map(entry=>entry.label).join('+');
      node.addEventListener('dragover',event=>{if(Array.from(event.dataTransfer.types).includes(MIME)){event.preventDefault();event.dataTransfer.dropEffect='link';node.classList.add('is-drop-target');}});
      node.addEventListener('dragleave',()=>node.classList.remove('is-drop-target'));
      node.addEventListener('drop',event=>{
        if(!Array.from(event.dataTransfer.types).includes(MIME))return;event.preventDefault();event.stopPropagation();node.classList.remove('is-drop-target');const raw=event.dataTransfer.getData(MIME);
        if(!/^\d+$/.test(raw))return;model.bind(targets,Number(raw));
      });
      node.addEventListener('click',event=>{const widget=event.target.closest('input,select,button');if(widget&&widget!==node&&!widget.classList.contains('pilami-control-destination'))return;if(model.selectedBand!==null){event.preventDefault();event.stopPropagation();model.bind(targets,model.selectedBand);}});
    }
    function renderBank(){
      const count=Math.min(16,Math.max(5,window.PilamiStrudelHydra.audio()?.fft.length||0));if(count===bankCount)return;bankCount=count;sources.replaceChildren();
      meters=Array.from({length:count},(_,band)=>{
        const button=element(doc,'button',null,{type:'button',draggable:'true',class:'pilami-audio-source','data-audio-band':String(band),'aria-label':'Source audio a.fft['+band+']','aria-pressed':'false'}),meter=element(doc,'meter',null,{min:'0',max:'1',value:'0','aria-label':'Niveau de la bande '+band});
        button.append(element(doc,'span','a.fft['+band+']'),meter);
        button.addEventListener('dragstart',event=>{event.dataTransfer.setData(MIME,String(band));event.dataTransfer.effectAllowed='link';});
        button.addEventListener('click',()=>{if(model){model.selectBand(band);refresh();}else audioStatus.textContent='Lance un visuel avec des contrôleurs avant de créer une liaison.';});sources.append(button);return{band,button,meter};
      });
    }
    function makeCard(entry){
      const card=element(doc,'section',null,{class:'pilami-control-card','data-control-id':entry.id}),top=element(doc,'div',null,{class:'pilami-control-heading'});
      const title=element(doc,'button',entry.label,{type:'button',class:'pilami-control-destination','aria-label':'Lier une source à '+entry.label}),kind=element(doc,'select',null,{'aria-label':'Présentation de '+entry.label,'data-control-kind':entry.label});
      const kinds=[['slider','Curseur'],['knob','Potentiomètre'],['fader','Fader vertical']];if(entry.min===0&&entry.max===1)kinds.push(['toggle','Interrupteur']);
      kinds.forEach(([value,label])=>kind.append(element(doc,'option',label,{value})));kind.value=entry.kind;kind.addEventListener('change',()=>model.setKind(entry,kind.value));top.append(title,kind);
      const control=element(doc,'div',null,{class:'pilami-control-value'}),input=element(doc,'input',null,{type:'range',min:entry.min,max:entry.max,step:entry.step,'aria-label':entry.label,'data-control-base':entry.label}),output=element(doc,'input',null,{type:'text',inputmode:'decimal',class:'pilami-control-number','aria-label':'Valeur manuelle de '+entry.label,'data-control-value':entry.label,autocomplete:'off',spellcheck:'false',title:'Entrée ou clic ailleurs : appliquer. Échap : annuler. Point ou virgule pour les décimales.'});input.value=entry.value;output.value=String(entry.value);
      const valueStatus=element(doc,'p','',{class:'pilami-control-help',role:'status','data-control-value-status':entry.label});valueStatus.hidden=true;
      let valueDraft=false;
      function cleanValue(){valueDraft=false;output.value=String(entry.value);output.removeAttribute('aria-invalid');valueStatus.hidden=true;}
      function applyValue(){
        if(!valueDraft)return;
        const raw=output.value.trim(),next=/^[+-]?(?:\d+(?:[.,]\d*)?|[.,]\d+)(?:e[+-]?\d+)?$/i.test(raw)?Number(raw.replace(',','.')):NaN;
        if(!Number.isFinite(next)){output.setAttribute('aria-invalid','true');valueStatus.textContent='Saisis un nombre, ou Échap pour revenir à la valeur actuelle.';valueStatus.hidden=false;return;}
        if(model.setBase(entry,next))cleanValue();
        else{valueStatus.textContent='La valeur n’a pas été appliquée. Vérifie le message de Hydra.';valueStatus.hidden=false;}
      }
      output.addEventListener('input',()=>{valueDraft=true;output.removeAttribute('aria-invalid');valueStatus.hidden=true;if(model.snapshots?.state.running)model.snapshots.stop();});
      output.addEventListener('blur',applyValue);
      output.addEventListener('keydown',event=>{if(event.key==='Enter'){event.preventDefault();event.stopPropagation();applyValue();}if(event.key==='Escape'){event.preventDefault();event.stopPropagation();cleanValue();}});
      input.addEventListener('input',()=>model.setBase(entry,Number(input.value)));control.append(input,output);
      const knob=element(doc,'button',null,{type:'button',class:'pilami-knob','aria-label':entry.label,title:'Glisse verticalement. Maj : réglage fin. Les flèches fonctionnent aussi.',role:'slider',tabindex:'0','aria-valuemin':entry.min,'aria-valuemax':entry.max,'data-control-knob':entry.label}),needle=element(doc,'span',null,{class:'pilami-knob-needle'});knob.append(needle);knob.hidden=entry.kind!=='knob';
      knob.addEventListener('pointerdown',event=>{if(event.button!==0)return;event.preventDefault();const startY=event.clientY,start=entry.value;knob.setPointerCapture(event.pointerId);const move=next=>model.setBase(entry,start+(startY-next.clientY)*(entry.max-entry.min)/180*(next.shiftKey ? 0.1 : 1));const end=()=>{knob.removeEventListener('pointermove',move);knob.removeEventListener('pointerup',end);knob.removeEventListener('pointercancel',end);};knob.addEventListener('pointermove',move);knob.addEventListener('pointerup',end);knob.addEventListener('pointercancel',end);});
      knob.addEventListener('keydown',event=>{const step=Number(entry.step)>0?Number(entry.step):(entry.max-entry.min)/100;let next;if(['ArrowUp','ArrowRight'].includes(event.key))next=entry.value+step;if(['ArrowDown','ArrowLeft'].includes(event.key))next=entry.value-step;if(event.key==='Home')next=entry.min;if(event.key==='End')next=entry.max;if(next!==undefined){event.preventDefault();model.setBase(entry,next);}});
      const toggle=element(doc,'button','Activer',{type:'button',class:'pilami-toggle',role:'switch','aria-label':entry.label,'aria-checked':'false','data-control-toggle':entry.label});toggle.hidden=entry.kind!=='toggle';toggle.addEventListener('click',()=>model.setBase(entry,entry.value>=.5?0:1));
      input.hidden=['knob','toggle'].includes(entry.kind);input.classList.toggle('pilami-fader',entry.kind==='fader');control.prepend(knob,toggle);
      const effective=element(doc,'p','',{class:'pilami-control-help','data-control-effective':entry.label});card.append(top,control,valueStatus,effective);
      const bounds=element(doc,'div',null,{class:'pilami-control-bounds','data-control-bounds':entry.label});
      const minLabel=element(doc,'label','Min '),maxLabel=element(doc,'label','Max ');
      const min=element(doc,'input',null,{type:'number',step:'any','aria-label':'Minimum de '+entry.label,'data-control-min':entry.label});min.value=String(entry.min);
      const max=element(doc,'input',null,{type:'number',step:'any','aria-label':'Maximum de '+entry.label,'data-control-max':entry.label});max.value=String(entry.max);
      const apply=element(doc,'button','Appliquer',{type:'button','aria-label':'Appliquer les bornes de '+entry.label,'data-control-range-apply':entry.label});
      const rangeStatus=element(doc,'p','',{class:'pilami-control-help pilami-range-status',role:'status','data-control-range-status':entry.label});rangeStatus.hidden=true;
      let rangeDraft=false;
      function cleanRange(){rangeDraft=false;min.value=String(entry.min);max.value=String(entry.max);rangeStatus.hidden=true;min.removeAttribute('aria-invalid');max.removeAttribute('aria-invalid');}
      function applyRange(){
        const low=min.value.trim()?min.valueAsNumber:NaN,high=max.value.trim()?max.valueAsNumber:NaN;
        if(!Number.isFinite(low)||!Number.isFinite(high)||low>=high){
          rangeStatus.textContent='Saisis deux nombres avec Min < Max.';rangeStatus.hidden=false;min.setAttribute('aria-invalid','true');max.setAttribute('aria-invalid','true');return;
        }
        if(model.setRange(entry,low,high))cleanRange();
        else{rangeStatus.textContent='Les bornes n’ont pas été appliquées. Vérifie le message de Hydra.';rangeStatus.hidden=false;}
      }
      [min,max].forEach(field=>{field.addEventListener('input',()=>{rangeDraft=true;rangeStatus.hidden=true;min.removeAttribute('aria-invalid');max.removeAttribute('aria-invalid');if(model.snapshots?.state.running)model.snapshots.stop();});field.addEventListener('keydown',event=>{if(event.key==='Enter'){event.preventDefault();event.stopPropagation();applyRange();}if(event.key==='Escape'){event.preventDefault();event.stopPropagation();cleanRange();}});});
      apply.addEventListener('click',applyRange);minLabel.append(min);maxLabel.append(max);bounds.append(minLabel,maxLabel,apply,rangeStatus);bounds.hidden=entry.kind==='toggle';card.append(bounds);
      let depth=null;
      if(entry.audio){
        const routing=element(doc,'div',null,{class:'pilami-audio-routing'}),source=element(doc,'select',null,{'aria-label':'Bande audio de '+entry.label,'data-control-band':entry.label});
        const count=Math.max(5,window.PilamiStrudelHydra.audio()?.fft.length||0,entry.audio.band+1);for(let band=0;band<Math.min(16,count);band++)source.append(element(doc,'option','a.fft['+band+']',{value:String(band)}));source.value=entry.audio.band;source.addEventListener('change',()=>model.bind([entry],Number(source.value)));
        const label=element(doc,'label','Profondeur ');depth=element(doc,'input',null,{type:'number',step:'any','aria-label':'Profondeur audio de '+entry.label,'data-control-depth':entry.label});depth.value=number(entry.audio.depth);depth.addEventListener('input',()=>{if(model.snapshots?.state.running)model.snapshots.stop();});depth.addEventListener('change',()=>{if(depth.value.trim())model.setDepth(entry,Number(depth.value));else refresh();});label.append(depth);
        const remove=element(doc,'button','Délier',{type:'button','data-control-unlink':entry.label});remove.addEventListener('click',()=>model.unlink(entry));routing.append(source,label,remove);card.append(routing);
      }
      const midiButton=element(doc,'button','MIDI Learn',{type:'button',class:'pilami-midi-control-learn','data-control-midi':entry.label,'aria-label':'Apprendre le MIDI pour '+entry.label});midiButton.addEventListener('click',()=>model.midi?.learn('control:'+model.entries.indexOf(entry)));card.append(midiButton);
      dropZone(card,[entry]);content.append(card);return{entry,input,output,midiButton,knob,needle,toggle,effective,depth,kind,bounds,min,max,rangeDraft:()=>rangeDraft,valueDraft:()=>valueDraft};
    }
    function makePad(pair){
      const card=element(doc,'section',null,{class:'pilami-xy-card','data-control-pad':pair.title}),title=element(doc,'h4',pair.title+' · Pad XY'),zones=element(doc,'div',null,{class:'pilami-xy-zones'});
      const x=element(doc,'button','Lier X · '+pair.x.label,{type:'button','data-control-axis':'x'}),y=element(doc,'button','Lier Y · '+pair.y.label,{type:'button','data-control-axis':'y'});dropZone(x,[pair.x]);dropZone(y,[pair.y]);zones.append(x,y);
      const pad=element(doc,'div',null,{class:'pilami-xy-pad',tabindex:'0',role:'group','aria-label':pair.title+' : flèches pour déplacer X et Y','data-xy-surface':pair.title}),dot=element(doc,'span',null,{class:'pilami-xy-dot'}),base=element(doc,'span',null,{class:'pilami-xy-base'});pad.append(base,dot);dropZone(pad,[pair.x,pair.y]);
      pad.addEventListener('pointerdown',event=>{
        if(event.button!==0||model.selectedBand!==null)return;event.preventDefault();pad.focus();pad.setPointerCapture(event.pointerId);
        const move=next=>{const bounds=pad.getBoundingClientRect();model.setXY(pair,pair.x.min+clamp((next.clientX-bounds.left)/bounds.width,0,1)*(pair.x.max-pair.x.min),pair.y.max-clamp((next.clientY-bounds.top)/bounds.height,0,1)*(pair.y.max-pair.y.min));};
        const end=()=>{pad.removeEventListener('pointermove',move);pad.removeEventListener('pointerup',end);pad.removeEventListener('pointercancel',end);};move(event);pad.addEventListener('pointermove',move);pad.addEventListener('pointerup',end);pad.addEventListener('pointercancel',end);
      });
      pad.addEventListener('keydown',event=>{const stepX=Number(pair.x.step)>0?Number(pair.x.step):(pair.x.max-pair.x.min)/100,stepY=Number(pair.y.step)>0?Number(pair.y.step):(pair.y.max-pair.y.min)/100;let dx=0,dy=0;if(event.key==='ArrowLeft')dx=-stepX;if(event.key==='ArrowRight')dx=stepX;if(event.key==='ArrowUp')dy=stepY;if(event.key==='ArrowDown')dy=-stepY;if(dx||dy){event.preventDefault();model.setXY(pair,pair.x.value+dx,pair.y.value+dy);}});
      const output=element(doc,'output','');card.append(title,zones,pad,output,element(doc,'p','Glisse ici une bande pour lier X et Y ensemble. Le point plein suit le son ; le cercle indique la position manuelle.',{class:'pilami-control-help'}));content.append(card);return{pair,dot,base,output,xButton:x,yButton:y};
    }
    function render(){
      if(!model)return;const next=model.entries.map(entry=>entry.id+':'+entry.kind+':'+(entry.audio?entry.audio.band:'-')).join('|');if(next===signature)return;signature=next;content.replaceChildren();pads=model.pads.map(makePad);rows=model.entries.map(makeCard);
    }
    function refresh(){
      if(!alive)return;renderBank();render();snapshotView?.refresh();midiView?.refresh();empty.hidden=Boolean(model?.entries.length);
      const audio=window.PilamiStrudelHydra.audio();connect.textContent=audio?.stream?.active?'Reconnecter l’entrée audio':'Activer l’entrée audio';
      const mic=root.querySelector('[data-hydra-audio-status]')?.textContent;
      if(model?.selectedBand!==null&&model?.selectedBand!==undefined)audioStatus.textContent='a.fft['+model.selectedBand+'] sélectionné : clique une destination.';
      else if(mic)audioStatus.textContent=mic+' · '+(audio?.fft.length||0)+' bandes, des graves aux aigus.';
      meters.forEach(({band,button,meter})=>{meter.value=audioLevel(band);button.setAttribute('aria-pressed',String(model?.selectedBand===band));button.classList.toggle('is-selected',model?.selectedBand===band);button.classList.toggle('is-unavailable',!audio||band>=audio.fft.length);});
      rows.forEach(row=>{const e=row.entry,current=value(e),target='control:'+model.entries.indexOf(e),binding=model.midi?.mappings().find(m=>m.target===target),learning=window.PilamiHydraMidi?.state.learning;
        const midiText=learning?.owner===model.midi&&learning.target===target?'En attente MIDI…':binding?'MIDI · '+(binding.type==='cc'?'CC ':'note ')+binding.number:'MIDI Learn';if(row.midiButton.textContent!==midiText)row.midiButton.textContent=midiText;row.midiButton.title=binding?window.PilamiHydraMidi.describe(binding):'Clique puis envoie un message MIDI';row.midiButton.hidden=!model.midi;
        row.input.min=e.min;row.input.max=e.max;row.input.step=e.step;row.knob.setAttribute('aria-valuemin',e.min);row.knob.setAttribute('aria-valuemax',e.max);
        if(!row.rangeDraft()){row.min.value=String(e.min);row.max.value=String(e.max);}
        const toggleOption=row.kind.querySelector('option[value="toggle"]');
        if(e.min===0&&e.max===1){if(!toggleOption)row.kind.append(element(doc,'option','Interrupteur',{value:'toggle'}));}else toggleOption?.remove();
        if(row.input.value!==String(e.value))row.input.value=e.value;if(!row.valueDraft())row.output.value=String(e.value);row.knob.setAttribute('aria-valuenow',number(e.value));row.needle.style.transform='rotate('+(-135+(e.value-e.min)/(e.max-e.min)*270)+'deg)';row.toggle.setAttribute('aria-checked',String(e.value>=.5));row.toggle.textContent=e.value>=.5?'Activé':'Désactivé';row.effective.textContent=e.audio?'Valeur avec audio : '+number(current)+' · a.fft['+e.audio.band+'] × '+number(e.audio.depth):'Valeur manuelle';if(row.depth&&doc.activeElement!==row.depth)row.depth.value=number(e.audio.depth);
      });
      pads.forEach(({pair,dot,base,output,xButton,yButton})=>{const x=value(pair.x),y=value(pair.y);dot.style.left=(x-pair.x.min)/(pair.x.max-pair.x.min)*100+'%';dot.style.top=(pair.y.max-y)/(pair.y.max-pair.y.min)*100+'%';base.style.left=(pair.x.value-pair.x.min)/(pair.x.max-pair.x.min)*100+'%';base.style.top=(pair.y.max-pair.y.value)/(pair.y.max-pair.y.min)*100+'%';output.textContent='X '+number(x)+' · Y '+number(y);[[xButton,pair.x,'X'],[yButton,pair.y,'Y']].forEach(([button,entry,axis])=>{button.textContent=entry.audio?axis+' · a.fft['+entry.audio.band+'] × '+number(entry.audio.depth):'Lier '+axis+' · '+entry.label;button.classList.toggle('has-audio',Boolean(entry.audio));});});
    }
    const unsubscribe=model?.subscribe(refresh);
    function tick(now){if(!alive||win.closed||!host.isConnected)return;if(now-last>=50){last=now;refresh();}frame=win.requestAnimationFrame(tick);}
    refresh();frame=win.requestAnimationFrame(tick);
    return{refresh,dispose(){alive=false;unsubscribe?.();snapshotView?.dispose();midiView?.dispose();if(frame&&!win.closed)win.cancelAnimationFrame(frame);}};
  }
  window.PilamiHydraControls={create,mount,value,validateAudio,audioLevel,cssURL};
})();
