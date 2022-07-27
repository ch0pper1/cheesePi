#!/usr/bin/python3
# This script will read the temperature from the ADC and convert it to Farenheit                                     .

import time
import math
import Adafruit_ADS1x15

class Temperature(object):

    def __init__(self, port):
        self.port = port


    #print('Reading ADC to get temperature.')

    #thermistor reading function
    def getTemp(self) -> float:
        # Constants
        beta = 3890.0
        room_temp = 298.15
        max_voltage = 4.096 / 32767.0 # modify voltage based on gain level

        GAIN = 1

        adc = Adafruit_ADS1x15.ADS1115()
        value = adc.read_adc(self.port, gain=GAIN) #read the adc
        voltage = (value * max_voltage)

        R = 10000.0 * ((5.18 / voltage) - 1.0)
        # print("ADC: ", value, "Voltage: ", voltage, ", Resistance: ", R)

        tempK = (beta * room_temp) / (beta + (room_temp * math.log(R/10000.0)))

        tempC = tempK - 273.15
        tempF = (9.0/5.0)*tempC + 32.0
        tempF = round(tempF, 1)
        #print "Temperature: ", tempF, " *F,", tempC, " *C,", tempK, " *K"
        return tempF
