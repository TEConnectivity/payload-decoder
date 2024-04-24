# TTN Payload Formater

Decoder used for TTN formatting. Also used for the online-codec. Projects will have to be merged. This repo is normally the most up to date decoder, but the encoder should be found in the online-codec repository.

## Tester

Launch the tester with any HTTP server, like python3 standard module for example : 

```python3 -m http.server```


## Implementation

The decoding function ```te_decode()``` has the keyword "export" to be integrable with other framework & libraries. When copied-pasted in TTN, this keyword must be deleted because TTN does not support it.